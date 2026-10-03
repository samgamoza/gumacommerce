<#
  Guma Kart - deploy to Cloudflare Workers (all three apps, or one).

    web       apps/web       -> kart.guma.one   (Worker gumakart-web)
    admin     apps/admin     -> admin.guma.one  (Worker gumakart-admin, runs the crons)
    platform  apps/platform  -> ops.guma.one    (Worker gumakart-platform)

  Run from the repo root in PowerShell:

    .\scripts\deploy-cloudflare.ps1                    # all three
    .\scripts\deploy-cloudflare.ps1 -App admin         # just one
    .\scripts\deploy-cloudflare.ps1 -SkipInstall       # faster re-deploys
    .\scripts\deploy-cloudflare.ps1 -SkipSecrets       # keep the Workers' stored secrets

  Settings come from .env, then .env.cloudflare on top (production values; gitignored).
  Put the PRODUCTION database there, so the dev URL in .env is never deployed:

    DATABASE_URL_POOLED=postgresql://...@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

  CRON_SECRET, STOREFRONT_PREVIEW_SECRET and SMS_OPT_OUT_SECRET are generated into
  .env.cloudflare on the first run. Safe launch defaults are added too:
  WALLET_PAYOUTS_ENABLED=false, BAYANGO_ENABLED=false, NEXT_PUBLIC_PLAN_BILLING_ENABLED=false.

  Cloudflare token (CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID in .env, or the Kuya Eddie .env):
    Account -> Workers Scripts:Edit, Workers R2 Storage:Edit
    Zone (guma.one) -> Workers Routes:Edit, DNS:Edit, Zone:Read

  admin.guma.one / ops.guma.one (and kart.guma.one) may still be Cloudflare Tunnel routes to
  Proxmox CT 106. A Worker custom domain can't share a hostname with a DNS record, so the
  script offers to delete that tunnel CNAME first (asks unless -Yes). Rollback: delete the
  Worker's custom domain and add the public hostname back on the tunnel.
#>
param(
  [ValidateSet("all", "web", "admin", "platform")]
  [string]$App = "all",
  [string]$Zone = "guma.one",
  [string]$Bucket = "gumakart-uploads",
  [switch]$SkipSecrets,
  [switch]$SkipInstall,
  [switch]$Yes
)

$ErrorActionPreference = "Continue"   # native stderr chatter must not abort; exit codes decide.
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
$Api = "https://api.cloudflare.com/client/v4"

$Apps = [ordered]@{
  web      = @{ Dir = "apps/web";      Host = "kart.$Zone";  Smoke = @("/kart", "/") }
  admin    = @{ Dir = "apps/admin";    Host = "admin.$Zone"; Smoke = @("/login") }
  platform = @{ Dir = "apps/platform"; Host = "ops.$Zone";   Smoke = @("/login") }
}
$Selected = if ($App -eq "all") { @("web", "admin", "platform") } else { @($App) }

function Info($msg) { Write-Host "   $msg" }
function Warn($msg) { Write-Host "   $msg" -ForegroundColor Yellow }
function Head($msg) { Write-Host "`n== $msg" -ForegroundColor Cyan }
function AskYes($question) {
  if ($Yes) { return $true }
  $answer = Read-Host "   $question [y/N]"
  return ($answer -match "^(y|yes)$")
}
function Cf($Method, $Path, $Body) {
  $req = @{ Method = $Method; Uri = "$Api$Path"; Headers = @{ Authorization = "Bearer $($env:CLOUDFLARE_API_TOKEN)" } }
  if ($Body) { $req.ContentType = "application/json"; $req.Body = ($Body | ConvertTo-Json -Compress -Depth 5) }
  $r = Invoke-RestMethod @req
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
function NewSecret() {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return ([Convert]::ToBase64String($bytes) -replace "[+/=]", "")
}
function DbHost($url) {
  try { return ([Uri]$url).Host } catch { return "" }
}

if (-not (Test-Path "pnpm-workspace.yaml")) { throw "Run this from the repo root (D:\All Apps\gumakart)." }

# ---------------------------------------------------------------- settings
Head "Settings"
$envMap = ReadEnvFile ".env"
$prodFile = ".env.cloudflare"
$prod = ReadEnvFile $prodFile
foreach ($k in $prod.Keys) { $envMap[$k] = $prod[$k] }
if (Test-Path $prodFile) { Info "using .env + $prodFile ($($prod.Count) overrides)" } else { Info "using .env (no $prodFile yet)" }

foreach ($fallback in @("E:\All Apps\Kuya Eddie\.env", "E:\All apps\Kuya Eddie\.env", "D:\All Apps\Kuya Eddie\.env")) {
  if ((-not $envMap["CLOUDFLARE_API_TOKEN"]) -and (Test-Path $fallback)) {
    $ke = ReadEnvFile $fallback
    if ($ke["CLOUDFLARE_API_TOKEN"]) { $envMap["CLOUDFLARE_API_TOKEN"] = $ke["CLOUDFLARE_API_TOKEN"]; Info "using CLOUDFLARE_API_TOKEN from $fallback" }
    if ($ke["CLOUDFLARE_ACCOUNT_ID"] -and -not $envMap["CLOUDFLARE_ACCOUNT_ID"]) { $envMap["CLOUDFLARE_ACCOUNT_ID"] = $ke["CLOUDFLARE_ACCOUNT_ID"] }
  }
}
if (-not $env:CLOUDFLARE_API_TOKEN -and $envMap["CLOUDFLARE_API_TOKEN"]) { $env:CLOUDFLARE_API_TOKEN = $envMap["CLOUDFLARE_API_TOKEN"] }
if (-not $env:CLOUDFLARE_ACCOUNT_ID -and $envMap["CLOUDFLARE_ACCOUNT_ID"]) { $env:CLOUDFLARE_ACCOUNT_ID = $envMap["CLOUDFLARE_ACCOUNT_ID"] }
if (-not $env:CLOUDFLARE_API_TOKEN) { throw "No CLOUDFLARE_API_TOKEN in .env (or the Kuya Eddie .env)." }

# Production database: pooled Neon URL, shown by host only.
$dbUrl = $envMap["DATABASE_URL_POOLED"]
if (-not $dbUrl) { $dbUrl = $envMap["DATABASE_URL"] }
$dbHostName = DbHost $dbUrl
if (-not $dbHostName) { throw "No database URL. Put DATABASE_URL_POOLED=<Neon production pooled URL> in $prodFile." }
if ($dbHostName -notlike "*-pooler*") {
  throw "The database URL ($dbHostName) is not a Neon *pooled* host. Put the production pooled URL in $prodFile as DATABASE_URL_POOLED."
}
Info "database host: $dbHostName"
if (-not (AskYes "Is that the PRODUCTION branch (Neon -> production -> Connect, pooled)?")) { throw "Stopped - fix DATABASE_URL_POOLED in $prodFile." }

# Generated secrets + launch defaults, persisted to .env.cloudflare.
$added = @()
foreach ($k in @("CRON_SECRET", "STOREFRONT_PREVIEW_SECRET", "SMS_OPT_OUT_SECRET")) {
  if (-not $envMap[$k]) { $envMap[$k] = NewSecret; $added += "$k=$($envMap[$k])" }
}
foreach ($pair in @(@("WALLET_PAYOUTS_ENABLED", "false"), @("BAYANGO_ENABLED", "false"), @("NEXT_PUBLIC_PLAN_BILLING_ENABLED", "false"))) {
  if (-not $envMap.Contains($pair[0])) { $envMap[$pair[0]] = $pair[1]; $added += "$($pair[0])=$($pair[1])" }
}
if (-not $prod.Contains("DATABASE_URL_POOLED")) { $added += "DATABASE_URL_POOLED=$dbUrl" }
if ($added.Count -gt 0) {
  $text = ""
  if (-not (Test-Path $prodFile)) { $text = "# Guma Kart production settings for scripts/deploy-cloudflare.ps1 (never commit)`r`n" }
  $text += ($added -join "`r`n") + "`r`n"
  [System.IO.File]::AppendAllText((Join-Path (Get-Location) $prodFile), $text)
  Info "wrote $($added.Count) value(s) to $prodFile : $(($added | ForEach-Object { ($_ -split '=', 2)[0] }) -join ', ')"
}

# ---------------------------------------------------------------- account
Head "Cloudflare account"
$verify = Cf GET "/user/tokens/verify"
if ($verify.status -ne "active") { throw "Token is $($verify.status)." }
$zoneObj = @(Cf GET "/zones?name=$Zone") | Select-Object -First 1
$AccountId = $env:CLOUDFLARE_ACCOUNT_ID
if (-not $AccountId -and $zoneObj -and $zoneObj.account) { $AccountId = $zoneObj.account.id }
if (-not $AccountId) { throw "Could not determine the account id. Put CLOUDFLARE_ACCOUNT_ID=... in .env." }
$env:CLOUDFLARE_ACCOUNT_ID = $AccountId
Info "account $AccountId"
if (-not $zoneObj) { Warn "zone $Zone not visible to this token (Zone:Read missing?) - custom domains need it" }

Head "R2 bucket $Bucket"
try {
  $buckets = @((Cf GET "/accounts/$AccountId/r2/buckets").buckets)
  if ($buckets | Where-Object { $_.name -eq $Bucket }) { Info "exists" }
  else { Cf POST "/accounts/$AccountId/r2/buckets" @{ name = $Bucket; locationHint = "apac" } | Out-Null; Info "created" }
} catch {
  Warn "could not check the bucket with this token ($($_.Exception.Message))."
  Warn "If deploy says 'R2 bucket not found', create '$Bucket' in the dashboard (R2 Object Storage)."
}

if (-not $SkipInstall) {
  Head "pnpm install"
  & pnpm install 2>&1 | ForEach-Object { Info $_ }
  if ($LASTEXITCODE -ne 0) { throw "pnpm install failed." }
}

# Values baked into the browser bundles at build time.
$env:NODE_ENV = "production"
$env:NEXT_PUBLIC_STOREFRONT_URL = "https://kart.$Zone"
$env:NEXT_PUBLIC_ADMIN_URL = "https://admin.$Zone"
$env:NEXT_PUBLIC_PLATFORM_URL = "https://ops.$Zone"
$env:NEXT_PUBLIC_ROOT_DOMAIN = $Zone
foreach ($k in $envMap.Keys) {
  if ($k -like "NEXT_PUBLIC_*" -and -not (Test-Path "Env:$k") -and $envMap[$k] -notmatch "localhost|127\.0\.0\.1") { Set-Item "Env:$k" $envMap[$k] }
}

# Runtime secrets (same set for all three Workers).
$secrets = [ordered]@{}
$skip = @("NODE_ENV", "PORT", "DATABASE_URL", "DATABASE_URL_UNPOOLED", "DIRECT_URL")
foreach ($k in $envMap.Keys) {
  $v = $envMap[$k]
  if (-not $v -or $k -like "CLOUDFLARE_*" -or $k -like "NEXT_PUBLIC_*" -or $skip -contains $k) { continue }
  if ($v -match "localhost|127\.0\.0\.1") { continue }
  $secrets[$k] = $v
}
$secrets["DATABASE_URL_POOLED"] = $dbUrl
$secrets["DATABASE_URL"] = $dbUrl

# ---------------------------------------------------------------- per app
$results = @()
foreach ($name in $Selected) {
  $cfg = $Apps[$name]
  $hostName = $cfg.Host
  Head "$name -> $hostName"

  # Old tunnel route on the same hostname blocks the Worker custom domain.
  if ($zoneObj) {
    try {
      $records = @(Cf GET "/zones/$($zoneObj.id)/dns_records?name=$hostName")
      foreach ($rec in $records) {
        if ($rec.type -eq "CNAME" -and $rec.content -like "*.cfargotunnel.com") {
          Warn "$hostName is still routed to the Proxmox tunnel ($($rec.content))."
          if (AskYes "Delete that DNS record so $hostName can point at the Worker?") {
            Cf DELETE "/zones/$($zoneObj.id)/dns_records/$($rec.id)" | Out-Null
            Info "deleted (remove $hostName from the tunnel's Public hostnames later, it's unused now)"
          } else { Warn "kept - the custom domain step will fail until it's removed" }
        } elseif ($rec.type -in @("A", "AAAA", "CNAME")) {
          Warn "$hostName has a $($rec.type) record -> $($rec.content). If deploy fails on the custom domain, delete it in DNS."
        }
      }
    } catch { Warn "could not read DNS for $hostName ($($_.Exception.Message))" }
  }

  Push-Location $cfg.Dir
  try {
    Info "building (OpenNext)..."
    & pnpm exec opennextjs-cloudflare build 2>&1 | ForEach-Object { Info $_ }
    if ($LASTEXITCODE -ne 0) { throw "$name : OpenNext build failed." }

    Info "deploying..."
    & pnpm exec wrangler deploy 2>&1 | ForEach-Object { Info $_ }
    if ($LASTEXITCODE -ne 0) { throw "$name : wrangler deploy failed." }

    if ($SkipSecrets) { Info "secrets skipped" } else {
      $tmp = [System.IO.Path]::GetTempFileName()
      try {
        [System.IO.File]::WriteAllText($tmp, ($secrets | ConvertTo-Json -Compress))
        & pnpm exec wrangler secret bulk $tmp 2>&1 | ForEach-Object { Info $_ }
        if ($LASTEXITCODE -ne 0) { throw "$name : wrangler secret bulk failed." }
      } finally { Remove-Item $tmp -Force -ErrorAction SilentlyContinue }
      Info "$($secrets.Count) secrets stored"
    }
  } finally { Pop-Location }

  Start-Sleep -Seconds 5
  foreach ($path in $cfg.Smoke) {
    try {
      $r = Invoke-WebRequest -Uri "https://$hostName$path" -Method GET -UseBasicParsing -TimeoutSec 30 -MaximumRedirection 0 -ErrorAction Stop
      Info "https://$hostName$path -> $($r.StatusCode)"
      $results += "$name OK   https://$hostName$path ($($r.StatusCode))"
    } catch {
      $code = $null
      try { $code = [int]$_.Exception.Response.StatusCode } catch { }
      if ($code -ge 300 -and $code -lt 400) { $results += "$name OK   https://$hostName$path ($code redirect)"; Info "https://$hostName$path -> $code" }
      else { $results += "$name CHECK https://$hostName$path ($($_.Exception.Message))"; Warn "https://$hostName$path -> $($_.Exception.Message)" }
    }
  }
}

Head "Summary"
$results | ForEach-Object { if ($_ -like "*CHECK*") { Warn $_ } else { Write-Host "   $_" -ForegroundColor Green } }
Write-Host "`nNew custom domains can take a few minutes to get their certificate - re-run the check if one says CHECK." -ForegroundColor Gray
Write-Host "Logs: cd apps\admin; pnpm exec wrangler tail     (crons log as [cron] lines every 5 minutes)" -ForegroundColor Gray
