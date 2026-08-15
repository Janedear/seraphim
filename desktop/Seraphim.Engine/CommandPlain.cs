using System.Text.RegularExpressions;

namespace Seraphim.Engine;

public static class CommandPlain
{
    public static string PlainLabel(string label)
    {
        if (string.IsNullOrWhiteSpace(label)) return "";
        var s = Regex.Replace(label, @"\s*\([^)]*\)", "");
        return Regex.Replace(s, @"\s+", " ").Trim();
    }

    public static string Describe(ToolSpec spec, IReadOnlyDictionary<string, string> values)
    {
        string? focus = null;
        var extras = new List<string>();

        foreach (var field in spec.Fields)
        {
            var raw = values.TryGetValue(field.Id, out var v) ? v : "";
            if (string.IsNullOrWhiteSpace(raw))
                raw = field.Default ?? "";

            if (field.Kind == FieldKind.Checkbox)
            {
                if (IsTrue(raw))
                    extras.Add(PlainLabel(field.Label));
                continue;
            }

            if (string.IsNullOrWhiteSpace(raw))
                continue;

            raw = raw.Trim();
            if (IsFocus(field))
            {
                focus = raw;
                continue;
            }

            extras.Add($"{PlainLabel(field.Label)} {raw}");
        }

        var head = string.IsNullOrEmpty(focus)
            ? $"{spec.Name} is ready to run."
            : $"{spec.Name} will check {focus}.";

        if (extras.Count == 0)
            return head;

        return head + " " + string.Join(". ", extras) + ".";
    }

    public static string CliLine(ToolSpec spec, IReadOnlyDictionary<string, string> values)
    {
        if (spec.BuiltIn)
            return "Runs inside Seraphim. No extra program needed.";
        var args = CommandBuilder.Build(spec, values);
        return args.Length == 0 ? spec.Executable : $"{spec.Executable} {string.Join(' ', args)}";
    }

    private static bool IsFocus(ToolField field) =>
        field.Kind == FieldKind.Target
        || field.Id.Equals("target", StringComparison.OrdinalIgnoreCase)
        || field.Id.Equals("url", StringComparison.OrdinalIgnoreCase)
        || field.Id.Equals("host", StringComparison.OrdinalIgnoreCase);

    private static bool IsTrue(string raw) =>
        raw.Equals("true", StringComparison.OrdinalIgnoreCase)
        || raw == "1"
        || raw.Equals("on", StringComparison.OrdinalIgnoreCase)
        || raw.Equals("yes", StringComparison.OrdinalIgnoreCase);
}
