# Seraphim

Native Windows pentest workbench. Kali-class catalog, Blue/Red menus, scope lock, and an on-device assistant that does not leave this PC by default.

**The product is `desktop/`** — `Seraphim.sln` (WPF app + engine + tests).

`src/`, `server/`, and `functions/` are a retired React prototype. Do not demo them. Do not evolve them.

## What it is

- **Catalog** — 771 tools with forms. Blue and Red are different menus, not a skin.
- **Run** — real processes (Windows nmap or Kali in WSL). We never fake a scan.
- **Scope** — public internet stays blocked unless you add it.
- **Inside** — local Ollama on `127.0.0.1:11434`. Agents propose forms; you click Run, or auto-run **in-scope only**.
- **BYO** — opt-in vendor path with redaction + send preview. Default remains Inside. Vendors still see whatever is in that preview.

Authorized use only. You are responsible for staying inside a written engagement.

## Requirements

- Windows 10/11
- .NET 8 SDK (user-local install is fine: `%LOCALAPPDATA%\Microsoft\dotnet`)
- For real tool launches: Windows nmap and/or WSL distro `kali-linux`
- For Inside: Ollama with at least one local model

## Build and run

```powershell
$env:DOTNET_ROOT = "$env:LOCALAPPDATA\Microsoft\dotnet"
$env:PATH = "$env:DOTNET_ROOT;$env:PATH"
cd desktop
dotnet test Seraphim.Engine.Tests\Seraphim.Engine.Tests.csproj --nologo
dotnet publish Seraphim.App\Seraphim.App.csproj -c Release -r win-x64 --self-contained true -o .\dist --nologo
.\dist\Seraphim.App.exe
```

First launch may show **Seraphim Setup**. That is the product installer, not a separate “Kali/Ollama” wizard.

## Layout

| Path | Role |
|------|------|
| `desktop/Seraphim.Engine` | Catalog, scope, allowlist, agent guard, job runner |
| `desktop/Seraphim.App` | WPF shell |
| `desktop/Seraphim.Engine.Tests` | xUnit |
| `src/` | Quarry (old SPA) |

## Tests

Engine tests must stay green before you call a change done.

```powershell
cd desktop
dotnet test Seraphim.Engine.Tests\Seraphim.Engine.Tests.csproj --nologo
```
