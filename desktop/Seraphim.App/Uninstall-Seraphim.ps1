$ErrorActionPreference = 'Continue'
$dest = Join-Path $env:LOCALAPPDATA 'Programs\Seraphim'
$links = @(
    (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Seraphim.lnk'),
    (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Seraphim.lnk')
)
foreach ($link in $links) {
    if ($link -and (Test-Path $link)) { Remove-Item $link -Force }
}
Stop-Process -Name Seraphim.App -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 400
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
Write-Output "DONE"
