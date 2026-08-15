using System.Net.Http;
using System.Text.Json;

namespace Seraphim.Engine;

public sealed record UpdateInfo(bool Available, string Current, string? Latest, string Url);

public static class UpdateCheck
{
    public static bool IsNewer(string current, string tag)
    {
        var a = Parse(current);
        var b = Parse(tag);
        if (a is null || b is null) return false;
        return b > a;
    }

    public static async Task<UpdateInfo> QueryAsync(HttpMessageHandler? handler = null, CancellationToken ct = default)
    {
        try
        {
            using HttpClient http = handler is null
                ? new HttpClient { Timeout = TimeSpan.FromSeconds(8) }
                : new HttpClient(handler, disposeHandler: false) { Timeout = TimeSpan.FromSeconds(8) };
            http.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", "Seraphim");
            http.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "application/vnd.github+json");
            var json = await http.GetStringAsync(AppVersion.ReleasesApi, ct);
            using var doc = JsonDocument.Parse(json);
            var tag = doc.RootElement.TryGetProperty("tag_name", out var t) ? t.GetString() ?? "" : "";
            var html = doc.RootElement.TryGetProperty("html_url", out var u) ? u.GetString() : null;
            if (string.IsNullOrWhiteSpace(html)) html = AppVersion.ReleasesHtml;
            var newer = IsNewer(AppVersion.Current, tag);
            return new UpdateInfo(newer, AppVersion.Current, tag, html);
        }
        catch
        {
            return new UpdateInfo(false, AppVersion.Current, null, AppVersion.ReleasesHtml);
        }
    }

    private static Version? Parse(string raw)
    {
        raw = raw.Trim();
        if (raw.StartsWith('v') || raw.StartsWith('V')) raw = raw[1..];
        return Version.TryParse(raw, out var v) ? v : null;
    }
}
