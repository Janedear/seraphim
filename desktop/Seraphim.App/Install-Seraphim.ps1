$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$dest = Join-Path $env:LOCALAPPDATA 'Programs\Seraphim'
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item -Path (Join-Path $here '*') -Destination $dest -Recurse -Force
$exe = Join-Path $dest 'Seraphim.App.exe'

function New-SeraphimShortcut([string]$path) {
    $ws = New-Object -ComObject WScript.Shell
    $lnk = $ws.CreateShortcut($path)
    $lnk.TargetPath = $exe
    $lnk.WorkingDirectory = $dest
    $lnk.Description = 'Seraphim workbench'
    if (Test-Path $exe) { $lnk.IconLocation = "$exe,0" }
    $lnk.Save()
}

$programs = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
New-Item -ItemType Directory -Force -Path $programs | Out-Null
New-SeraphimShortcut (Join-Path $programs 'Seraphim.lnk')
$desktop = [Environment]::GetFolderPath('Desktop')
if (-not [string]::IsNullOrWhiteSpace($desktop)) {
    New-SeraphimShortcut (Join-Path $desktop 'Seraphim.lnk')
}

Write-Output "STEP:4"
Write-Output "DONE"
Write-Output $exe
Write-Output (Join-Path $dest 'Uninstall-Seraphim.ps1')
