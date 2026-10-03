<#
  Kept for muscle memory: deploys only the storefront (kart.guma.one).
  Everything now lives in scripts/deploy-cloudflare.ps1 (web, admin, platform).
#>
param([switch]$SkipSecrets, [switch]$SkipInstall, [switch]$Yes)
& "$PSScriptRoot\deploy-cloudflare.ps1" -App web -SkipSecrets:$SkipSecrets -SkipInstall:$SkipInstall -Yes:$Yes
exit $LASTEXITCODE
