using System.Diagnostics;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace Seraphim.Engine;

public sealed class InsideClient
{
    private readonly HttpClient _http;
    private readonly string _base;

    public InsideClient(string baseUrl, HttpClient? http = null)
    {
        _base = baseUrl.TrimEnd('/');
        _http = http ?? new HttpClient { Timeout = TimeSpan.FromSeconds(120) };
    }

    private string _model = "";

    public string Model => _model;

    public static string? FirstModelName(string tagsJson)
    {
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(tagsJson);
            if (!doc.RootElement.TryGetProperty("models", out var models)) return null;
            foreach (var m in models.EnumerateArray())
            {
                if (m.TryGetProperty("name", out var name))
                {
                    var s = name.GetString();
                    if (!string.IsNullOrWhiteSpace(s)) return s;
                }
            }
        }
        catch (System.Text.Json.JsonException)
        {
            return null;
        }
        return null;
    }

    public async Task<string> CompleteAsync(string userText, string? session = null, string? system = null, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_model) && !await PingAsync(ct))
            throw new InvalidOperationException("Inside isn't ready yet.");

        var content = session is null
            ? userText
            : $"Operator question:\n{userText}\n\nAttached session (local only):\n{session}";

        var systemText = system ?? "You are Seraphim's on-device assistant. Do not call external APIs. Help with pentest methodology and the attached session if present.";

        var body = new ChatRequest(
            _model,
            [new ChatMessage("system", systemText),
             new ChatMessage("user", content)]);

        using var res = await _http.PostAsJsonAsync($"{_base}/v1/chat/completions", body, ct);
        res.EnsureSuccessStatusCode();
        var parsed = await res.Content.ReadFromJsonAsync<ChatResponse>(ct);
        return parsed?.Choices?.FirstOrDefault()?.Message?.Content ?? "(empty Inside reply)";
    }

    public async Task<bool> PingAsync(CancellationToken ct = default)
    {
        try
        {
            using var res = await _http.GetAsync($"{_base}/api/tags", ct);
            if (!res.IsSuccessStatusCode) return false;
            var json = await res.Content.ReadAsStringAsync(ct);
            var found = FirstModelName(json);
            if (string.IsNullOrWhiteSpace(found)) return false;
            _model = found;
            return true;
        }
        catch
        {
            return false;
        }
    }

    public static void TryWake()
    {
        try
        {
            var exe = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Programs", "Ollama", "ollama.exe");
            if (!File.Exists(exe)) return;
            Process.Start(new ProcessStartInfo
            {
                FileName = exe,
                Arguments = "serve",
                UseShellExecute = false,
                CreateNoWindow = true,
                WindowStyle = ProcessWindowStyle.Hidden,
            });
        }
        catch
        {
            // Inside stays off if the local helper isn't installed yet.
        }
    }

    public async Task<bool> EnsureAsync(CancellationToken ct = default)
    {
        if (await PingAsync(ct)) return true;
        TryWake();
        await Task.Delay(1500, ct);
        return await PingAsync(ct);
    }

    private sealed record ChatRequest(string Model, ChatMessage[] Messages);
    private sealed record ChatMessage(string Role, string Content);
    private sealed record ChatResponse([property: JsonPropertyName("choices")] Choice[]? Choices);
    private sealed record Choice([property: JsonPropertyName("message")] ChatMessage? Message);
}
