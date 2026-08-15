param(
    [Parameter(Mandatory = $true)]
    [string]$Path
)

# Signs Seraphim.App.exe only when SERAPHIM_PFX is a real Authenticode certificate.
# No generated or throwaway certificates. Unsigned is honest.

if (-not (Test-Path -LiteralPath $Path)) {
    Write-Output "Nothing to sign."
    exit 0
}

$pfx = $env:SERAPHIM_PFX
if ([string]::IsNullOrWhiteSpace($pfx) -or -not (Test-Path -LiteralPath $pfx)) {
    Write-Output "No SERAPHIM_PFX. Leaving unsigned. SmartScreen may warn."
    exit 0
}

$signtool = $null
foreach ($kit in @(
    "${env:ProgramFiles(x86)}\Windows Kits\10\bin\x64\signtool.exe",
    "${env:ProgramFiles(x86)}\Windows Kits\10\App Certification Kit\signtool.exe"
)) {
    if (Test-Path $kit) { $signtool = $kit; break }
}
if (-not $signtool) {
    $hit = Get-ChildItem -Path "${env:ProgramFiles(x86)}\Windows Kits\10\bin" -Filter signtool.exe -Recurse -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($hit) { $signtool = $hit.FullName }
}
if (-not $signtool) {
    Write-Output "signtool.exe not installed. Leaving unsigned."
    exit 0
}

$args = @('sign', '/fd', 'SHA256', '/td', 'SHA256', '/tr', 'http://timestamp.digicert.com', '/f', $pfx)
if (-not [string]::IsNullOrWhiteSpace($env:SERAPHIM_PFX_PASSWORD)) {
    $args += @('/p', $env:SERAPHIM_PFX_PASSWORD)
}
$args += $Path
& $signtool @args
if ($LASTEXITCODE -ne 0) {
    Write-Output "signtool failed. Leaving unsigned."
    exit 0
}
Write-Output "Signed $Path"
exit 0
