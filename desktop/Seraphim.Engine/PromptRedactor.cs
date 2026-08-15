using System.Text.RegularExpressions;

namespace Seraphim.Engine;

public sealed record RedactionPreview(string Original, string Redacted, IReadOnlyList<string> Removed);

public static class PromptRedactor
{
    private static readonly Regex Ip = new(
        @"\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b",
        RegexOptions.Compiled);

    private static readonly Regex Email = new(
        @"\b[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex Secret = new(
        @"\b(?:sk-[A-Za-z0-9]{8,}|ghp_[A-Za-z0-9]{20,}|Bearer\s+[A-Za-z0-9\-._~+/]+=*)\b",
        RegexOptions.Compiled);

    public static RedactionPreview Preview(string text)
    {
        var removed = new List<string>();
        var redacted = text;
        redacted = Replace(redacted, Secret, "[REDACTED-SECRET]", removed);
        redacted = Replace(redacted, Email, "[REDACTED-EMAIL]", removed);
        redacted = Replace(redacted, Ip, "[REDACTED-IP]", removed);
        return new RedactionPreview(text, redacted, removed);
    }

    private static string Replace(string text, Regex rx, string token, List<string> removed) =>
        rx.Replace(text, m =>
        {
            removed.Add(m.Value);
            return token;
        });
}

public static class VendorCopy
{
    public const string Leaves = "This leaves this PC. Review the redacted preview before send.";
    public const string Preview = "Preview of what the vendor will receive.";
    public const string DefaultInside = "Default is Inside. Nothing leaves unless you choose BYO.";
    public const string NotMagic = "Redaction hides IPs, emails, and key-shaped strings. The vendor still sees everything in the preview.";

    public static IEnumerable<string> UserVisible => [Leaves, Preview, DefaultInside, NotMagic];
}

public static class EngagementReport
{
    public static string Outline(IReadOnlyList<Finding> findings)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("# Engagement report");
        sb.AppendLine();
        if (findings.Count == 0)
        {
            sb.AppendLine("No saved findings yet.");
            return sb.ToString();
        }
        foreach (var f in findings)
        {
            sb.AppendLine($"## {f.Title}");
            sb.AppendLine(f.Evidence);
            sb.AppendLine();
        }
        return sb.ToString();
    }

    public static string DraftPrompt(IReadOnlyList<Finding> findings) =>
        "Draft a short engagement report in plain English from these local findings. Do not invent hosts or ports that are not listed.\n\n"
        + Outline(findings);
}
