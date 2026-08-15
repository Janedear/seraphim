# Seraphim

[![engine](https://github.com/Janedear/seraphim/actions/workflows/engine.yml/badge.svg)](https://github.com/Janedear/seraphim/actions/workflows/engine.yml)

Native Windows pentest workbench. Kali-class catalog, Blue/Red menus, and an on-device assistant that does not leave this PC by default.

**The product is `desktop/`** — `Seraphim.sln` (WPF app + engine + tests).

`quarry/` is a retired React prototype. Do not demo it. Do not evolve it.

## What it is

- **Catalog** — 771 tools with forms. Blue and Red change start category and chrome. The full Kali menu is always there.
- **Run** — real processes (Windows nmap or Kali in WSL). We never fake a scan. You pick the target.
- **Inside** — local Ollama on `127.0.0.1:11434`. Agents propose forms; you click Run, or auto-run if you left that on.
- **BYO** — opt-in vendor path with redaction + send preview. Default remains Inside. Vendors still see whatever is in that preview.

Authorized use only. You are responsible for staying inside a written engagement.

## Requirements

- Windows 10/11
- .NET 8 SDK (user-local install is fine: `%LOCALAPPDATA%\Microsoft\dotnet`)
- For real tool launches: Windows nmap and/or WSL distro `kali-linux`
- For Inside: a local 8B-class model (`llama3.1:8b`). Setup pulls that; Inside prefers it over any leftover 1B smoke model.

## Build and run

```powershell
$env:DOTNET_ROOT = "$env:LOCALAPPDATA\Microsoft\dotnet"
$env:PATH = "$env:DOTNET_ROOT;$env:PATH"
cd desktop
dotnet test Seraphim.Engine.Tests\Seraphim.Engine.Tests.csproj --nologo
dotnet publish Seraphim.App\Seraphim.App.csproj -c Release -r win-x64 --self-contained true -o .\dist --nologo
.\dist\Seraphim.App.exe
```

First launch may show **Seraphim Setup**. There is no license kill-switch.

## Install (this PC)

```powershell
cd desktop
.\Pack-Seraphim.ps1
.\dist\Install-Seraphim.ps1
```

That copies the workbench to `%LocalAppData%\Programs\Seraphim` and adds Start Menu + Desktop shortcuts. Uninstall: `.\dist\Uninstall-Seraphim.ps1` (or the copy under Programs\Seraphim).

The zip and exe are **unsigned**. SmartScreen may warn. We do not fake a signature.

CI: `.github/workflows/engine.yml` runs `dotnet test` on Windows. Architecture: `desktop/ARCHITECTURE.md`. Demo: `desktop/DEMO.md`.

## Layout

| Path | Role |
|------|------|
| `desktop/Seraphim.Engine` | Catalog, allowlist, agent guard, job runner |
| `desktop/Seraphim.App` | WPF shell |
| `desktop/Seraphim.Engine.Tests` | xUnit |
| `desktop/DEMO.md` | 12-minute investor demo script |
| `quarry/` | Retired React prototype. Not the product. |

## Tests

Engine tests must stay green before you call a change done.

```powershell
cd desktop
dotnet test Seraphim.Engine.Tests\Seraphim.Engine.Tests.csproj --nologo
```
