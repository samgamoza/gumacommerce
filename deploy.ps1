<#
  Guma One - one-command deploy to Proxmox CT 106 (guma.one).

  Usage:
    .\deploy.ps1           # normal deploy (fast incremental build)
    .\deploy.ps1 -Force    # full rebuild (use after editing .env / NEXT_PUBLIC_* URLs)

  Flow: package working tree -> scp to pve -> pct push into CT 106 -> build + pm2 restart.
  The container keeps its own .env and node_modules (excluded from the package).
#>
param([switch]$Force)
$ErrorActionPreference = "Stop"

$repo = "D:\All Apps\gumacommerce"
$pve  = "root@192.168.1.15"
$ct   = 106
$tmp  = "$env:TEMP\guma-deploy.tar.gz"
$sw   = [System.Diagnostics.Stopwatch]::StartNew()

Write-Host "==> packaging working tree..." -ForegroundColor Cyan
if (Test-Path $tmp) { Remove-Item $tmp }
# Exclude runtime uploads so local empty dirs never clobber CT product photos.
tar -czf $tmp --exclude=node_modules --exclude=.next --exclude=.turbo --exclude=.git --exclude=simply-sweet-source --exclude=reference --exclude=apps/web/public/uploads/products --exclude=apps/web/public/uploads/payment-proofs -C $repo .
$mb = "{0:N1}" -f ((Get-Item $tmp).Length / 1MB)
Write-Host "    packaged ($mb MB)"

Write-Host "==> transferring to pve ($pve)..." -ForegroundColor Cyan
scp -o BatchMode=yes $tmp "${pve}:/tmp/guma-deploy.tar.gz"

Write-Host "==> building + restarting on CT $ct (this is the ~1-2 min part)..." -ForegroundColor Cyan
$arg = if ($Force) { "force" } else { "" }
ssh -o BatchMode=yes $pve "pct push $ct /tmp/guma-deploy.tar.gz /root/guma-deploy.tar.gz && pct exec $ct -- bash /root/redeploy.sh $arg"

$sw.Stop()
Write-Host ("==> DONE - live on https://guma.one  ({0:N0}s)" -f $sw.Elapsed.TotalSeconds) -ForegroundColor Green
