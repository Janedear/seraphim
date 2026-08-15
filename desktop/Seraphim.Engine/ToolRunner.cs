namespace Seraphim.Engine;

public sealed record RunPlan(bool Allowed, string Executable, string[] Arguments, string Reason);

public static class ToolRunner
{
    private static readonly HashSet<string> FileExt = new(StringComparer.OrdinalIgnoreCase)
    {
        ".txt", ".lst", ".cap", ".pcap", ".pcapng", ".hc22000", ".hccapx", ".hash",
        ".pot", ".conf", ".xml", ".json", ".csv", ".wordlist", ".dic", ".dict",
        ".gz", ".zip", ".7z", ".bin", ".exe", ".dll", ".img", ".iso", ".raw",
        ".e01", ".dd", ".mem", ".dmp", ".pcapng",
    };

    private static readonly Lazy<HashSet<string>> Allow = new(BuildAllow);

    public static IReadOnlySet<string> Allowlist => Allow.Value;

    public static RunPlan Plan(string executable, string[] arguments, Scope scope)
    {
        var name = Path.GetFileName(executable);
        if (!Allow.Value.Contains(name))
            return new RunPlan(false, executable, arguments, "Executable is not on the allowlist.");

        foreach (var arg in arguments)
        {
            var host = ExtractHost(arg);
            if (host is null) continue;
            if (!scope.Allows(host))
                return new RunPlan(false, executable, arguments,
                    $"'{arg}' isn't on your allowed list (scope: {scope.Raw}). Add that network in Scope, then Run again.");
        }

        return new RunPlan(true, name, arguments, "ok");
    }

    public static string? ExtractHost(string arg)
    {
        if (string.IsNullOrWhiteSpace(arg) || arg.StartsWith('-'))
            return null;
        if (arg.Contains('\\') || arg.Contains(' ') || arg.Contains(','))
            return null;
        if (arg.StartsWith('/') && !arg.Contains("://"))
            return null;
        if (arg.StartsWith("e.g.", StringComparison.OrdinalIgnoreCase))
            return null;

        if (Uri.TryCreate(arg, UriKind.Absolute, out var uri)
            && uri.Host.Length > 0
            && uri.Scheme is not "file")
            return uri.Host;

        var ext = Path.GetExtension(arg);
        if (ext.Length > 0 && FileExt.Contains(ext))
            return null;

        var slash = arg.IndexOf('/');
        if (slash > 0 && System.Net.IPAddress.TryParse(arg[..slash], out _))
            return arg[..slash];

        if (System.Net.IPAddress.TryParse(arg, out var parsed)
            && IsDottedOrIpv6(arg, parsed))
            return arg;

        if (arg.Equals("localhost", StringComparison.OrdinalIgnoreCase))
            return arg;

        var colon = arg.LastIndexOf(':');
        if (colon > 0
            && int.TryParse(arg[(colon + 1)..], out _)
            && System.Net.IPAddress.TryParse(arg[..colon], out _))
            return arg[..colon];

        if (LooksLikeHostname(arg))
            return arg;

        return null;
    }

    private static bool LooksLikeHostname(string arg)
    {
        if (!arg.Contains('.') || arg.Contains('/'))
            return false;
        var hasLetter = false;
        foreach (var c in arg)
        {
            if (char.IsAsciiLetter(c)) hasLetter = true;
            else if (c is not '.' and not '-' && !char.IsAsciiDigit(c))
                return false;
        }
        return hasLetter;
    }

    private static bool IsDottedOrIpv6(string arg, System.Net.IPAddress ip) =>
        (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork && arg.Contains('.'))
        || (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6 && arg.Contains(':'));

    private static HashSet<string> BuildAllow()
    {
        var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "naabu", "naabu.exe", "httpx", "httpx.exe", "nuclei", "nuclei.exe",
            "wsl", "wsl.exe",
        };
        foreach (var tool in Catalog.Tools)
        {
            if (tool.BuiltIn || string.IsNullOrWhiteSpace(tool.Executable))
                continue;
            set.Add(tool.Executable);
            if (!tool.Executable.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
                set.Add(tool.Executable + ".exe");
        }
        return set;
    }
}
