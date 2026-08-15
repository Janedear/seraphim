namespace Seraphim.Engine;

public static class CommandBuilder
{
    public static Dictionary<string, string> WithPreset(ToolSpec spec, string? name)
    {
        var map = spec.Fields.ToDictionary(f => f.Id, f => f.Default ?? "");
        var preset = spec.Presets?.FirstOrDefault(p => p.Name == name);
        if (preset is null) return map;
        foreach (var kv in preset.Values)
            map[kv.Key] = kv.Value;
        return map;
    }

    public static string[] Build(ToolSpec spec, IReadOnlyDictionary<string, string> values)
    {
        var args = new List<string>();
        if (spec.Prefix is { Count: > 0 })
            args.AddRange(spec.Prefix);

        var positionals = new List<string>();
        foreach (var field in spec.Fields)
        {
            if (field.Id == "ports" && IsTrue(Get(values, "allPorts")))
                continue;

            var raw = Get(values, field.Id);
            if (string.IsNullOrWhiteSpace(raw))
                raw = field.Default ?? "";

            if (field.Kind == FieldKind.Checkbox)
            {
                if (IsTrue(raw) && !string.IsNullOrEmpty(field.Flag))
                    args.Add(field.Flag);
                continue;
            }

            if (string.IsNullOrWhiteSpace(raw))
                continue;

            if (field.Positional || field.Kind == FieldKind.Target)
            {
                positionals.Add(raw.Trim());
                continue;
            }

            if (!string.IsNullOrEmpty(field.Flag))
                args.Add(field.Flag);
            args.Add(raw.Trim());
        }

        args.AddRange(positionals);
        return args.ToArray();
    }

    private static string Get(IReadOnlyDictionary<string, string> values, string key) =>
        values.TryGetValue(key, out var v) ? v : "";

    private static bool IsTrue(string raw) =>
        raw.Equals("true", StringComparison.OrdinalIgnoreCase)
        || raw == "1"
        || raw.Equals("on", StringComparison.OrdinalIgnoreCase)
        || raw.Equals("yes", StringComparison.OrdinalIgnoreCase);
}
