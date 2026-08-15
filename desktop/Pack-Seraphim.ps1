$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:DOTNET_ROOT = Join-Path $env:LOCALAPPDATA 'Microsoft\dotnet'
$env:PATH = "$env:DOTNET_ROOT;$env:PATH"
Set-Location $root

$out = Join-Path $root 'dist'
dotnet publish (Join-Path $root 'Seraphim.App\Seraphim.App.csproj') `
    -c Release -r win-x64 --self-contained true -o $out --nologo
if ($LASTEXITCODE -ne 0) { throw "publish failed: $LASTEXITCODE" }

$sign = Join-Path $root 'Sign-Seraphim.ps1'
if (Test-Path $sign) {
    & $sign (Join-Path $out 'Seraphim.App.exe')
}

$ver = '0.1.0'
$versionFile = Join-Path $root 'Seraphim.Engine\AppVersion.cs'
if (Test-Path $versionFile) {
    $hit = Select-String -Path $versionFile -Pattern 'Current = "([^"]+)"' | Select-Object -First 1
    if ($hit) { $ver = $hit.Matches[0].Groups[1].Value }
}

$pack = Join-Path $root 'pack'
New-Item -ItemType Directory -Force -Path $pack | Out-Null
$zip = Join-Path $pack "Seraphim-$ver-win-x64.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $out '*') -DestinationPath $zip -Force
Write-Output $zip
if ($env:SERAPHIM_PFX -and (Test-Path $env:SERAPHIM_PFX)) {
    Write-Output "Signed with SERAPHIM_PFX when signtool succeeded."
} else {
    Write-Output "Unsigned zip. SmartScreen may warn. Do not fake a signature."
}
