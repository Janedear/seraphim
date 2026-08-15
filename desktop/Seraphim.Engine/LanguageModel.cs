namespace Seraphim.Engine;

public enum ModelKind
{
    Off,
    Inside,
    Byo,
}

public enum LlmProvider
{
    None,
    Ollama,
    Anthropic,
    OpenAI,
    Gemini,
    Azure,
    Groq,
    Bedrock,
    Custom,
}

public sealed class LanguageModel
{
    public ModelKind Kind { get; init; }
    public LlmProvider Provider { get; init; }
    public string? Endpoint { get; init; }
    public string? ApiKey { get; init; }

    public static LanguageModel Default { get; } = Inside("http://127.0.0.1:11434");

    public bool LeavesMachine => Kind == ModelKind.Byo;

    public static LanguageModel Off() => new()
    {
        Kind = ModelKind.Off,
        Provider = LlmProvider.None,
    };

    public static LanguageModel Inside(string loopbackUrl) => new()
    {
        Kind = ModelKind.Inside,
        Provider = LlmProvider.Ollama,
        Endpoint = loopbackUrl,
    };

    public static LanguageModel Byo(LlmProvider provider, string apiKey, string? endpoint) => new()
    {
        Kind = ModelKind.Byo,
        Provider = provider,
        ApiKey = apiKey,
        Endpoint = endpoint,
    };

    public static LanguageModel FromEndpoint(string url, string? apiKey)
    {
        if (Uri.TryCreate(url, UriKind.Absolute, out var uri)
            && (uri.Host is "127.0.0.1" or "localhost" or "::1"))
        {
            return Inside(url);
        }

        return Byo(LlmProvider.Custom, apiKey ?? "", url);
    }
}
