$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:DOTNET_ROOT = Join-Path $env:LOCALAPPDATA 'Microsoft\dotnet'
$env:PATH = "$env:DOTNET_ROOT;$env:PATH"
Set-Location $root

$out = Join-Path $root 'dist'
dotnet publish (Join-Path $root 'Seraphim.App\Seraphim.App.csproj') `
    -c Release -r win-x64 --self-contained true -o $out --nologo
if ($LASTEXITCODE -ne 0) { throw "publish failed: $LASTEXITCODE" }

$pack = Join-Path $root 'pack'
New-Item -ItemType Directory -Force -Path $pack | Out-Null
$zip = Join-Path $pack 'Seraphim-0.1.0-win-x64.zip'
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $out '*') -DestinationPath $zip -Force
Write-Output $zip
Write-Output "Unsigned zip. SmartScreen may warn. Do not fake a signature."
