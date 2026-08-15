namespace Seraphim.Engine;

public sealed class ToolLocatorOptions
{
    public string? Path { get; init; }
    public bool? WslReady { get; init; }
    public string Distro { get; init; } = WslKali.Distro;
    public string? WslExe { get; init; }
}

public sealed record ToolLaunch(
    bool Found,
    string FileName,
    IReadOnlyList<string> Arguments,
    string How,
    bool ViaWsl);

public static class ToolLocator
{
    public static ToolLaunch Resolve(string executable, string[] args, ToolLocatorOptions? options = null)
    {
        options ??= new ToolLocatorOptions();
        var native = FindNative(executable, options.Path);
        var wslReady = options.WslReady ?? WslKali.IsReady();
        var wsl = options.WslExe ?? WslKali.FindWsl();

        if (WindowsFirst(executable) && native is not null)
            return new ToolLaunch(true, native, args, "Windows", false);

        if (wslReady && !string.IsNullOrEmpty(wsl))
        {
            var argv = new List<string> { "-d", options.Distro, "--", executable };
            argv.AddRange(args);
            return new ToolLaunch(true, wsl, argv, "Kali", true);
        }

        if (native is not null)
            return new ToolLaunch(true, native, args, "Windows", false);

        return new ToolLaunch(false, "", [], "", false);
    }

    private static bool WindowsFirst(string executable) =>
        executable.Equals("nmap", StringComparison.OrdinalIgnoreCase)
        || executable.Equals("nmap.exe", StringComparison.OrdinalIgnoreCase);

    public static string? FindNative(string executable, string? path = null)
    {
        foreach (var name in Names(executable))
        {
            var hit = FindOnPath(name, path);
            if (hit is not null) return hit;
        }

        if (executable.Equals("nmap", StringComparison.OrdinalIgnoreCase)
            || executable.Equals("nmap.exe", StringComparison.OrdinalIgnoreCase))
        {
            foreach (var wellKnown in ToolboxSetup.NmapWellKnownPaths())
            {
                if (File.Exists(wellKnown)) return wellKnown;
            }
        }

        return null;
    }

    public static bool HasToolbox() =>
        FindNative("nmap") is not null || WslKali.IsReady();

    public static string Status()
    {
        var nmap = FindNative("nmap");
        var kali = WslKali.IsReady();
        if (nmap is not null && kali) return "Ready";
        if (nmap is not null || kali) return "Ready";
        return "Setup";
    }

    private static IEnumerable<string> Names(string executable)
    {
        yield return executable;
        if (!executable.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
            yield return executable + ".exe";
    }

    public static string? FindOnPath(string file, string? path = null)
    {
        path ??= Environment.GetEnvironmentVariable("PATH") ?? "";
        foreach (var dir in path.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            try
            {
                var candidate = Path.Combine(dir.Trim(), file);
                if (File.Exists(candidate)) return candidate;
            }
            catch
            {
                // skip bad PATH entries
            }
        }
        return null;
    }
}

public static class WslKali
{
    public const string Distro = "kali-linux";

    public static string? FindWsl()
    {
        var sys = Environment.GetFolderPath(Environment.SpecialFolder.System);
        var exe = Path.Combine(sys, "wsl.exe");
        return File.Exists(exe) ? exe : ToolLocator.FindOnPath("wsl.exe");
    }

    private static bool? _ready;
    private static DateTime _readyAt;

    public static bool IsReady()
    {
        if (_ready is bool cached && DateTime.UtcNow - _readyAt < TimeSpan.FromSeconds(30))
            return cached;

        var wsl = FindWsl();
        if (wsl is null)
        {
            _ready = false;
            _readyAt = DateTime.UtcNow;
            return false;
        }
        try
        {
            var p = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = wsl,
                Arguments = "-l -q",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            });
            if (p is null) return false;
            var output = p.StandardOutput.ReadToEnd() + p.StandardError.ReadToEnd();
            p.WaitForExit(4000);
            _ready = ListingHasDistro(output, Distro);
            _readyAt = DateTime.UtcNow;
            return _ready.Value;
        }
        catch
        {
            _ready = false;
            _readyAt = DateTime.UtcNow;
            return false;
        }
    }

    public static readonly string[] CoreTools = ["nmap", "sqlmap", "gobuster", "hydra", "nikto"];

    public static bool HasBinary(string executable)
    {
        var wsl = FindWsl();
        if (wsl is null || !IsReady()) return false;
        try
        {
            var p = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = wsl,
                Arguments = $"-d {Distro} -- which {executable}",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            });
            if (p is null) return false;
            var output = p.StandardOutput.ReadToEnd();
            p.WaitForExit(8000);
            return p.ExitCode == 0 && output.Contains(executable, StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }

    public static bool ListingHasDistro(string listing, string distro)
    {
        var cleaned = listing.Replace("\0", "");
        foreach (var line in cleaned.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries))
        {
            var name = line.Trim().TrimStart('*').Trim();
            if (name.Equals(distro, StringComparison.OrdinalIgnoreCase))
                return true;
        }
        return false;
    }
}

public static class ToolboxSetup
{
    public static string CompletePath =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Seraphim", "setup-complete.txt");

    public static string AttemptPath =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Seraphim", "toolbox-setup.txt");

    public static bool IsComplete()
    {
        try { return File.Exists(CompletePath); }
        catch { return false; }
    }

    public static bool NeedsUi() => !IsComplete() && !ToolLocator.HasToolbox();

    public static bool Attempted() => IsComplete();

    public static void MarkComplete()
    {
        var dir = Path.GetDirectoryName(CompletePath);
        if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
        File.WriteAllText(CompletePath, DateTimeOffset.UtcNow.ToString("o"));
    }

    public static void MarkAttempted() => MarkComplete();

    public static IReadOnlyList<string> NmapWellKnownPaths()
    {
        var paths = new List<string>();
        foreach (var root in new[]
                 {
                     Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
                     Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
                 })
        {
            if (!string.IsNullOrEmpty(root))
                paths.Add(Path.Combine(root, "Nmap", "nmap.exe"));
        }
        return paths;
    }

    public const string ScriptFileName = "Setup-Seraphim.ps1";

    public static string ScriptBody => """
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
        wsl.exe -d kali-linux -u root -- bash -lc "export DEBIAN_FRONTEND=noninteractive; apt-get update -y && apt-get install -y kali-linux-core kali-tools-top10 wordlists nmap sqlmap gobuster hydra nikto metasploit-framework"
        if ($needReboot) { Write-Output 'REBOOT' }
        Write-Output 'DONE'
        """;
}
