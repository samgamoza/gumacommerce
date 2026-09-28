<#
  Guma Kart - deploy the storefront (apps/web) to Cloudflare Workers at kart.guma.one.

  Run from the repo root in PowerShell:

    .\scripts\deploy-kart.ps1                 # build + deploy + secrets
    .\scripts\deploy-kart.ps1 -SkipSecrets    # leave the Worker's stored secrets untouched
    .\scripts\deploy-kart.ps1 -SkipInstall    # skip pnpm install (faster re-deploys)

  Reads CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID from .env (falls back to the
  Kuya Eddie repo's .env). Token needs, on top of the Kuya Eddie permissions:
    Account -> Workers Scripts : Edit
    Account -> Workers R2 Storage : Edit      (for the gumakart-uploads bucket)
    Zone    -> Workers Routes : Edit, DNS : Edit, Zone : Read   (guma.one)

  What it does:
    1. Verifies the token, resolves the account.
    2. Creates the R2 bucket gumakart-uploads if missing (payment proofs + product photos).
    3. pnpm install, then OpenNext build of apps/web (NEXT_PUBLIC_* pinned to kart.guma.one).
    4. wrangler deploy -> Worker gumakart-web on custom domain kart.guma.one (DNS is created
       automatically for a custom_domain route).
    5. Uploads every non-empty key in .env (except CLOUDFLARE_* / NEXT_PUBLIC_*) as Worker secrets.
    6. Smoke-tests https://kart.guma.one/kart.

  Admin (admin.guma.one) and platform (ops.guma.one) stay on the Proxmox tunnel; only the
  storefront moves. Existing product photos on CT 106 must be copied to R2 once (see docs/DEPLOY-KART.md).
#>
param(
  [string]$Zone = "guma.one",
  [string]$Hostname = "kart.guma.one",
  [string]$Bucket = "gumakart-uploads",
  [switch]$SkipSecrets,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Continue"   # native stderr chatter must not abort; exit codes decide.
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
$Api = "https://api.cloudflare.com/client/v4"
$Web = "apps/web"

function Step($n, $msg) { Write-Host "`n[$n/6] $msg" -ForegroundColor Cyan }
function Cf($Method, $Path, $Body) {
  $args = @{ Method = $Method; Uri = "$Api$Path"; Headers = @{ Authorization = "Bearer $($env:CLOUDFLARE_API_TOKEN)" } }
  if ($Body) { $args.ContentType = "application/json"; $args.Body = ($Body | ConvertTo-Json -Compress -Depth 5) }
  $r = Invoke-RestMethod @args
  if (-not $r.success) { throw "Cloudflare $Method $Path : $($r.errors | ConvertTo-Json -Compress)" }
  return $r.result
}
function ReadEnvFile($path) {
  $map = [ordered]@{}
  if (Test-Path $path) {
    Get-Content $path | ForEach-Object {
      $line = $_.Trim()
      if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $k, $v = $line -split "=", 2
        $map[$k.Trim()] = $v.Trim().Trim('"').Trim("'")
      }
    }
  }
  return $map
}

if (-not (Test-Path "pnpm-workspace.yaml")) { throw "Run this from the repo root (D:\All Apps\gumacommerce)." }

$envMap = ReadEnvFile ".env"
foreach ($fallback in @("E:\All Apps\Kuya Eddie\.env", "E:\All apps\Kuya Eddie\.env")) {
  if ((-not $envMap["CLOUDFLARE_API_TOKEN"]) -and (Test-Path $fallback)) {
    $ke = ReadEnvFile $fallback
    if ($ke["CLOUDFLARE_API_TOKEN"]) { $envMap["CLOUDFLARE_API_TOKEN"] = $ke["CLOUDFLARE_API_TOKEN"]; Write-Host "   using CLOUDFLARE_API_TOKEN from $fallback" }
    if ($ke["CLOUDFLARE_ACCOUNT_ID"] -and -not $envMap["CLOUDFLARE_ACCOUNT_ID"]) { $envMap["CLOUDFLARE_ACCOUNT_ID"] = $ke["CLOUDFLARE_ACCOUNT_ID"] }
  }
}
if (-not $env:CLOUDFLARE_API_TOKEN -and $envMap["CLOUDFLARE_API_TOKEN"]) { $env:CLOUDFLARE_API_TOKEN = $envMap["CLOUDFLARE_API_TOKEN"] }
if (-not $env:CLOUDFLARE_ACCOUNT_ID -and $envMap["CLOUDFLARE_ACCOUNT_ID"]) { $env:CLOUDFLARE_ACCOUNT_ID = $envMap["CLOUDFLARE_ACCOUNT_ID"] }
if (-not $env:CLOUDFLARE_API_TOKEN) { throw "No CLOUDFLARE_API_TOKEN in .env (or the Kuya Eddie .env)." }
if (-not $envMap["DATABASE_URL"]) { throw ".env is missing DATABASE_URL (Neon pooled URL)." }

Step 1 "Token + account"
$verify = Cf GET "/user/tokens/verify"
if ($verify.status -ne "active") { throw "Token is $($verify.status)." }
$zone = @(Cf GET "/zones?name=$Zone") | Select-Object -First 1
$AccountId = $env:CLOUDFLARE_ACCOUNT_ID
if (-not $AccountId -and $zone -and $zone.account) { $AccountId = $zone.account.id }
if (-not $AccountId) { try { $acct = @(Cf GET "/accounts") | Select-Object -First 1; if ($acct) { $AccountId = $acct.id } } catch { } }
if (-not $AccountId) { throw "Could not determine the account id. Put CLOUDFLARE_ACCOUNT_ID=... in .env." }
$env:CLOUDFLARE_ACCOUNT_ID = $AccountId
Write-Host "   account $AccountId"
if (-not $zone) { Write-Host "   zone $Zone not visible to this token (Zone:Read missing?) - the custom domain needs it" -ForegroundColor Yellow }

Step 2 "R2 bucket $Bucket"
$bucketOk = $false
try {
  $buckets = @((Cf GET "/accounts/$AccountId/r2/buckets").buckets)
  if ($buckets | Where-Object { $_.name -eq $Bucket }) { Write-Host "   exists"; $bucketOk = $true }
  else { Cf POST "/accounts/$AccountId/r2/buckets" @{ name = $Bucket; locationHint = "apac" } | Out-Null; Write-Host "   created"; $bucketOk = $true }
} catch {
  Write-Host "   API could not verify/create the bucket: $($_.Exception.Message)" -ForegroundColor Yellow
  Write-Host "   trying wrangler..."
  Push-Location $Web
  try {
    & pnpm exec wrangler r2 bucket create $Bucket --location apac 2>&1 | ForEach-Object { Write-Host "   $_" }
    if ($LASTEXITCODE -eq 0) { $bucketOk = $true }
    else {
      & pnpm exec wrangler r2 bucket list 2>&1 | Out-String | ForEach-Object { if ($_ -match [regex]::Escape($Bucket)) { $bucketOk = $true } }
    }
  } finally { Pop-Location }
}
if (-not $bucketOk) {
  Write-Host "   Could not verify '$Bucket' with this token (it lacks R2 read access) - continuing anyway." -ForegroundColor Yellow
  Write-Host "   If the deploy fails with 'R2 bucket not found', create it in the dashboard (R2 Object Storage -> Create bucket -> '$Bucket')." -ForegroundColor Yellow
}

Step 3 "Build (OpenNext)"
if (-not $SkipInstall) {
  & pnpm install 2>&1 | ForEach-Object { Write-Host "   $_" }
  if ($LASTEXITCODE -ne 0) { throw "pnpm install failed." }
}
$env:NODE_ENV = "production"
$env:NEXT_PUBLIC_STOREFRONT_URL = "https://$Hostname"
if ($envMap["NEXT_PUBLIC_ADMIN_URL"]) { $env:NEXT_PUBLIC_ADMIN_URL = $envMap["NEXT_PUBLIC_ADMIN_URL"] } else { $env:NEXT_PUBLIC_ADMIN_URL = "https://admin.$Zone" }
$env:NEXT_PUBLIC_ROOT_DOMAIN = $Zone
foreach ($k in $envMap.Keys) { if ($k -like "NEXT_PUBLIC_*" -and -not (Test-Path "Env:$k")) { Set-Item "Env:$k" $envMap[$k] } }
Push-Location $Web
try {
  & pnpm exec opennextjs-cloudflare build 2>&1 | ForEach-Object { Write-Host "   $_" }
  if ($LASTEXITCODE -ne 0) { throw "OpenNext build failed." }

  Step 4 "wrangler deploy -> $Hostname"
  $deployOut = & pnpm exec wrangler deploy 2>&1 | ForEach-Object { "$_" }
  $deployOut | ForEach-Object { Write-Host "   $_" }
  if ($LASTEXITCODE -ne 0) { throw "wrangler deploy failed." }

  Step 5 "Secrets"
  if ($SkipSecrets) { Write-Host "   skipped" } else {
    $secrets = [ordered]@{}
    foreach ($k in $envMap.Keys) {
      if ($k -like "CLOUDFLARE_*" -or $k -like "NEXT_PUBLIC_*" -or -not $envMap[$k]) { continue }
      $secrets[$k] = $envMap[$k]
    }
    if (-not $secrets["DATABASE_URL_POOLED"] -and $envMap["DATABASE_URL"]) { $secrets["DATABASE_URL_POOLED"] = $envMap["DATABASE_URL"] }
    $tmp = [System.IO.Path]::GetTempFileName()
    try {
      [System.IO.File]::WriteAllText($tmp, ($secrets | ConvertTo-Json -Compress))
      & pnpm exec wrangler secret bulk $tmp 2>&1 | ForEach-Object { Write-Host "   $_" }
      if ($LASTEXITCODE -ne 0) { throw "wrangler secret bulk failed." }
    } finally { Remove-Item $tmp -Force -ErrorAction SilentlyContinue }
    Write-Host "   $($secrets.Count) secrets stored: $($secrets.Keys -join ', ')"
  }
} finally { Pop-Location }

Step 6 "Smoke test"
Start-Sleep -Seconds 5
foreach ($path in @("/kart", "/")) {
  try {
    $r = Invoke-WebRequest -Uri "https://$Hostname$path" -Method GET -UseBasicParsing -TimeoutSec 30
    Write-Host "   https://$Hostname$path -> $($r.StatusCode)" -ForegroundColor Green
  } catch {
    Write-Host "   https://$Hostname$path -> $($_.Exception.Message)" -ForegroundColor Yellow
  }
}
Write-Host "`nDone. Storefront + /kart revamp live at https://$Hostname  (Worker gumakart-web, R2 $Bucket)" -ForegroundColor Green
Write-Host "Logs: pnpm --filter @guma-commerce/web exec wrangler tail"
