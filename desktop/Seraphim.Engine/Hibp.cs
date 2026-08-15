using System.Net.Http;

namespace Seraphim.Engine;

public static class Hibp
{
    public const string RangeUrl = "https://api.pwnedpasswords.com/range/";

    public static bool IsPrefix(string raw)
    {
        var p = (raw ?? "").Trim();
        if (p.Length != 5) return false;
        foreach (var c in p)
        {
            if (!char.IsAsciiHexDigit(c)) return false;
        }
        return true;
    }

    public static async Task<string> LookupAsync(string prefix, HttpMessageHandler? handler = null, CancellationToken ct = default)
    {
        prefix = prefix.Trim().ToUpperInvariant();
        if (!IsPrefix(prefix))
            throw new ArgumentException("Need the first 5 hex characters of the SHA-1.");

        using HttpClient http = handler is null
            ? new HttpClient { Timeout = TimeSpan.FromSeconds(15) }
            : new HttpClient(handler, disposeHandler: false) { Timeout = TimeSpan.FromSeconds(15) };
        http.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", "Seraphim");
        return await http.GetStringAsync(RangeUrl + prefix, ct);
    }
}
