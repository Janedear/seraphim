# Seraphim architecture

Native Windows workbench. Product code lives in this folder. Retired React prototype is `../quarry/` — do not demo it.

## Pieces

| Piece | Role |
|-------|------|
| `Seraphim.Engine` | Catalog, allowlist, job runner, Inside/BYO, findings, agent guard |
| `Seraphim.App` | WPF shell: Blue/Red, forms, session, setup, authorized-use gate |
| `Seraphim.Engine.Tests` | xUnit. Engine tests must stay green. |

## Operator loop

1. Operator types in the prompt bar.
2. **Inside** (default) talks to a local 8B-class model on `127.0.0.1:11434`. Nothing leaves this PC. If only a 1B smoke model is installed, Inside still runs — it prefers 8B/7B, then 3B, then whatever is there.
3. The model proposes JSON `{action, say, tool, values}`.
4. `AgentGuard` strips unknown tools and extra argv. It does not lock targets.
5. The form fills. **Run** and auto-run both call `Job.RunAsync` — same `ToolLocator` + process path. We never fake output.
6. Successful auto-runs save a finding to `%LocalAppData%\Seraphim\findings.sqlite`.

**BYO** is opt-in. Redaction + a send preview. The vendor still sees whatever is in that preview.

## Safety

- **Targets** — the operator's. This is Kali for Windows, not a home-lab sandbox.
- **Allowlist** — only known binaries (nmap, WSL Kali tools, etc.). No `cmd.exe` for the model.
- **Team** — Blue and Red are different catalogs, not a theme. Blue home category is Forensics; Red is Exploitation Tools.
- **Authorized use** — first launch requires a written-permission checkbox. Decline exits.
- **No first-party C2 or implants.**

## Run path

`Job` → `ToolLocator` (Windows nmap or `wsl -d kali-linux`) → `ToolRunner` (one-shot) or `PtySession` (ConPTY for interactive consoles like Metasploit). Missing tools say they are not ready. They do not invent a scan.

## Layout on disk

`%LocalAppData%\Seraphim\` — team, authorized flag, findings SQLite.

Install (unsigned): `Pack-Seraphim.ps1` then `dist\Install-Seraphim.ps1` copies to `%LocalAppData%\Programs\Seraphim` and adds Start Menu + Desktop shortcuts. SmartScreen may warn. We do not fake a signature. Uninstall: `Uninstall-Seraphim.ps1`.
