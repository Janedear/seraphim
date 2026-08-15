using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Seraphim.Engine;

public static class ByoClient
{
    public static async Task<string> CompleteAsync(
        LanguageModel model,
        RedactionPreview preview,
        string? system = null,
        CancellationToken ct = default)
    {
        if (!model.LeavesMachine)
            throw new InvalidOperationException("BYO is only for vendor endpoints.");
        if (string.IsNullOrWhiteSpace(model.ApiKey))
            throw new InvalidOperationException("BYO needs an API key.");

        var systemText = system ?? "You are helping with a pentest write-up. Use only the redacted text provided.";
        using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(120) };

        if (model.Provider == LlmProvider.Anthropic)
            return await Anthropic(http, model, preview.Redacted, systemText, ct);

        return await OpenAiCompat(http, model, preview.Redacted, systemText, ct);
    }

    private static async Task<string> OpenAiCompat(HttpClient http, LanguageModel model, string redacted, string system, CancellationToken ct)
    {
        var root = (model.Endpoint ?? "https://api.openai.com").TrimEnd('/');
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", model.ApiKey);
        var body = new
        {
            model = "gpt-4o-mini",
            messages = new[]
            {
                new { role = "system", content = system },
                new { role = "user", content = redacted },
            },
        };
        using var res = await http.PostAsJsonAsync($"{root}/v1/chat/completions", body, ct);
        res.EnsureSuccessStatusCode();
        var parsed = await res.Content.ReadFromJsonAsync<ChatResponse>(ct);
        return parsed?.Choices?.FirstOrDefault()?.Message?.Content ?? "(empty vendor reply)";
    }

    private static async Task<string> Anthropic(HttpClient http, LanguageModel model, string redacted, string system, CancellationToken ct)
    {
        var root = (model.Endpoint ?? "https://api.anthropic.com").TrimEnd('/');
        http.DefaultRequestHeaders.Add("x-api-key", model.ApiKey);
        http.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");
        var payload = new
        {
            model = "claude-sonnet-4-20250514",
            max_tokens = 1024,
            system,
            messages = new[] { new { role = "user", content = redacted } },
        };
        using var res = await http.PostAsJsonAsync($"{root}/v1/messages", payload, ct);
        res.EnsureSuccessStatusCode();
        var json = await res.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("content", out var content)) return json;
        foreach (var part in content.EnumerateArray())
        {
            if (part.TryGetProperty("text", out var text))
                return text.GetString() ?? json;
        }
        return json;
    }

    private sealed record ChatResponse([property: JsonPropertyName("choices")] Choice[]? Choices);
    private sealed record Choice([property: JsonPropertyName("message")] Msg? Message);
    private sealed record Msg([property: JsonPropertyName("content")] string? Content);
}
