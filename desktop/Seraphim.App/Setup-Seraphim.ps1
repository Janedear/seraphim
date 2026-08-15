$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
$env:Path = "$env:LOCALAPPDATA\Microsoft\WindowsApps;$env:Path"
function Step([int]$n) { Write-Output "STEP:$n" }
Step 1
winget install --id Insecure.Nmap -e --accept-package-agreements --accept-source-agreements --disable-interactivity --silent
Step 2
winget install --id Ollama.Ollama -e --accept-package-agreements --accept-source-agreements --disable-interactivity --silent
$ollama = Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe'
if (Test-Path $ollama) {
  Start-Process -FilePath $ollama -ArgumentList 'serve' -WindowStyle Hidden -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
  & $ollama pull llama3.1:8b
}
Step 3
$needReboot = $false
$list = & wsl.exe -l -q 2>$null | Out-String
if ($list -notmatch 'kali-linux') {
  $wslOut = & wsl.exe --install -d kali-linux --no-launch 2>&1 | Out-String
  if ($wslOut -match 'restart|reboot|Reboot') { $needReboot = $true }
}
Step 4
wsl.exe -d kali-linux -u root -- bash -lc "export DEBIAN_FRONTEND=noninteractive; apt-get update -y && apt-get install -y kali-tools-top10 nmap sqlmap gobuster hydra nikto"
if ($needReboot) { Write-Output 'REBOOT' }
Write-Output 'DONE'
