using System.Text;
using System.Text.Json;

namespace Seraphim.Engine;

public enum AgentAction
{
    Chat,
    Propose,
}

public sealed record AgentPersona(
    string Id,
    string Name,
    string Summary,
    IReadOnlyList<string>? Categories,
    bool MayProposeTools);

public sealed record AgentProposal(
    AgentAction Action,
    string Say,
    string? ToolId,
    IReadOnlyDictionary<string, string> Values);

public sealed record AgentDecision(
    bool ApplyForm,
    bool AutoRun,
    string Say,
    string Reason,
    ToolSpec? Tool,
    IReadOnlyDictionary<string, string> Values);

public static class AgentRoster
{
    public static readonly AgentPersona Operator = new(
        "operator", "Operator",
        "Can fill any catalog form. You click Run, or auto-run when the target is in scope.",
        Categories: null,
        MayProposeTools: true);

    public static readonly AgentPersona Recon = new(
        "recon", "Recon",
        "Information gathering only. Fills scan/lookup forms. You click Run.",
        Categories: ["Information Gathering"],
        MayProposeTools: true);

    public static readonly AgentPersona Web = new(
        "web", "Web",
        "Web-app forms only. Cannot arm a shell. You click Run.",
        Categories: ["Web Application Analysis"],
        MayProposeTools: true);

    public static readonly AgentPersona Reporter = new(
        "reporter", "Reporter",
        "Talk and write-up only. Cannot fill or run tools.",
        Categories: [],
        MayProposeTools: false);

    public static IReadOnlyList<AgentPersona> All { get; } = [Operator, Recon, Web, Reporter];
}

public static class AgentTurn
{
    public static AgentProposal Parse(string raw)
    {
        var json = ExtractObject(raw);
        if (json is null)
            return new AgentProposal(AgentAction.Chat, raw.Trim(), null, new Dictionary<string, string>());

        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var say = Str(root, "say");
            var tool = Str(root, "tool");
            var actionText = Str(root, "action");
            var action = actionText.Equals("propose", StringComparison.OrdinalIgnoreCase)
                         && !string.IsNullOrWhiteSpace(tool)
                ? AgentAction.Propose
                : AgentAction.Chat;

            var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            if (root.TryGetProperty("values", out var bag) && bag.ValueKind == JsonValueKind.Object)
            {
                foreach (var p in bag.EnumerateObject())
                    values[p.Name] = p.Value.ValueKind == JsonValueKind.String
                        ? p.Value.GetString() ?? ""
                        : p.Value.ToString();
            }

            return new AgentProposal(action, say, string.IsNullOrWhiteSpace(tool) ? null : tool, values);
        }
        catch (JsonException)
        {
            return new AgentProposal(AgentAction.Chat, raw.Trim(), null, new Dictionary<string, string>());
        }
    }

    private static string? ExtractObject(string raw)
    {
        var start = raw.IndexOf('{');
        var end = raw.LastIndexOf('}');
        if (start < 0 || end <= start) return null;
        return raw[start..(end + 1)];
    }

    private static string Str(JsonElement root, string name) =>
        root.TryGetProperty(name, out var el) && el.ValueKind == JsonValueKind.String
            ? el.GetString() ?? ""
            : "";
}

public static class AgentGuard
{
    public static AgentDecision Review(AgentPersona persona, AgentProposal proposal, Scope scope, Team? team = null, bool autoRunInScope = false)
    {
        if (proposal.Action != AgentAction.Propose)
            return Chat(proposal.Say, "chat");

        if (!persona.MayProposeTools)
            return Chat(proposal.Say, $"{persona.Name} is talk-only and cannot fill tools.");

        var spec = Catalog.ById(proposal.ToolId ?? "");
        if (spec is null)
            return Chat(proposal.Say, "Unknown tool. Nothing was filled.");

        if (persona.Categories is { Count: > 0 } && !persona.Categories.Contains(spec.Category))
            return Chat(proposal.Say, $"{persona.Name} cannot use {spec.Name} ({spec.Category}).");

        if (team is Team t && !Catalog.VisibleTo(spec, t))
            return Chat(proposal.Say, $"{spec.Name} is not on this team's menu.");

        var values = Sanitize(spec, proposal.Values);
        var args = CommandBuilder.Build(spec, values);

        if (spec.BuiltIn)
        {
            var target = values.GetValueOrDefault("target") ?? values.GetValueOrDefault("url") ?? "";
            if (!string.IsNullOrWhiteSpace(target) && !scope.Allows(ExtractHost(target) ?? target))
                return Chat(proposal.Say, $"Target is outside engagement scope.");
        }
        else
        {
            var plan = ToolRunner.Plan(spec.Executable, args, scope);
            if (!plan.Allowed)
                return Chat(proposal.Say, plan.Reason);
        }

        var say = string.IsNullOrWhiteSpace(proposal.Say)
            ? CommandPlain.Describe(spec, values)
            : proposal.Say;
        return new AgentDecision(true, autoRunInScope, say, "ok", spec, values);
    }

    public static string SystemPrompt(AgentPersona persona)
    {
        var tools = AllowedTools(persona);
        var sb = new StringBuilder();
        sb.AppendLine("You are a Seraphim Inside agent on this PC. Never call the internet. Never invent scan results.");
        sb.AppendLine("You do not run tools. You may only talk, or propose a form fill.");
        sb.AppendLine("Reply with ONE JSON object, no markdown:");
        sb.AppendLine("""{"action":"chat","say":"plain English"}""");
        sb.AppendLine("""{"action":"propose","say":"plain English","tool":"id","values":{"target":"10.0.0.1"}}""");
        sb.AppendLine($"Persona: {persona.Name}. {persona.Summary}");
        if (!persona.MayProposeTools)
        {
            sb.AppendLine("action must be chat. Do not propose tools.");
            return sb.ToString();
        }
        sb.AppendLine("Prefer these tool ids: " + string.Join(", ", tools));
        sb.AppendLine("Only propose in-scope lab targets. Never set osShell or extra argv.");
        return sb.ToString();
    }

    private static IEnumerable<string> AllowedTools(AgentPersona persona)
    {
        IEnumerable<ToolSpec> q = Catalog.Tools;
        if (persona.Categories is { Count: > 0 })
            q = q.Where(t => persona.Categories.Contains(t.Category));
        return q.Select(t => t.Id).Take(24);
    }

    private static Dictionary<string, string> Sanitize(ToolSpec spec, IReadOnlyDictionary<string, string> incoming)
    {
        var map = CommandBuilder.WithPreset(spec, spec.PresetNames.FirstOrDefault());
        foreach (var field in spec.Fields)
        {
            if (!incoming.TryGetValue(field.Id, out var raw)) continue;
            if (IsArmedDanger(field, raw))
            {
                map[field.Id] = field.Kind == FieldKind.Checkbox ? "false" : "";
                continue;
            }
            map[field.Id] = raw;
        }
        return map;
    }

    private static bool IsArmedDanger(ToolField field, string raw)
    {
        var id = field.Id;
        var flag = field.Flag ?? "";
        var dangerous = id.Contains("shell", StringComparison.OrdinalIgnoreCase)
                        || flag.Contains("os-shell", StringComparison.OrdinalIgnoreCase)
                        || id.Equals("extra", StringComparison.OrdinalIgnoreCase)
                        || id.Equals("argv", StringComparison.OrdinalIgnoreCase);
        if (!dangerous) return false;
        if (field.Kind == FieldKind.Checkbox)
            return raw.Equals("true", StringComparison.OrdinalIgnoreCase) || raw == "1";
        return !string.IsNullOrWhiteSpace(raw);
    }

    private static AgentDecision Chat(string say, string reason) =>
        new(false, false, say, reason, null, new Dictionary<string, string>());

    private static string? ExtractHost(string arg)
    {
        if (Uri.TryCreate(arg, UriKind.Absolute, out var uri) && uri.Host.Length > 0)
            return uri.Host;
        return arg;
    }
}
