namespace Seraphim.Engine;

public enum FieldKind
{
    Text,
    Checkbox,
    Select,
    Number,
    Target,
}

public sealed record ToolField(
    string Id,
    string Label,
    FieldKind Kind,
    string Flag,
    bool Required = false,
    string? Default = null,
    string? Placeholder = null,
    IReadOnlyList<string>? Options = null,
    bool Positional = false);

public sealed record ToolPreset(string Name, IReadOnlyDictionary<string, string> Values);

public sealed record ToolSpec(
    string Id,
    string Name,
    string Category,
    string Executable,
    string Summary,
    IReadOnlyList<ToolField> Fields,
    IReadOnlyList<ToolPreset>? Presets = null,
    IReadOnlyList<string>? Prefix = null,
    bool BuiltIn = false,
    TeamSide Side = TeamSide.Both)
{
    public IReadOnlyList<string> PresetNames =>
        Presets is { Count: > 0 } ? Presets.Select(p => p.Name).ToArray() : [];
}

public enum TeamSide
{
    Both,
    Blue,
    Red,
}

public static class Fields
{
    public static ToolField Target(string label = "Computer or network to check", string? placeholder = "e.g. 10.0.0.1", string? @default = "10.0.0.1") =>
        new("target", label, FieldKind.Target, "", Required: true, Default: @default, Placeholder: placeholder, Positional: true);

    public static ToolField Url(string id = "url", string flag = "-u") =>
        new(id, "Website address", FieldKind.Text, flag, Required: true, Placeholder: "e.g. http://10.0.0.1/");

    public static ToolField Flag(string id, string label, string flag) =>
        new(id, label, FieldKind.Checkbox, flag);

    public static ToolField Text(string id, string label, string flag, string? placeholder = null, string? @default = null) =>
        new(id, label, FieldKind.Text, flag, Default: @default, Placeholder: placeholder);

    public static ToolField Select(string id, string label, string flag, params string[] options) =>
        new(id, label, FieldKind.Select, flag, Options: options);

    public static ToolField Wordlist(string flag = "-w") =>
        new("wordlist", "List of passwords or names to try", FieldKind.Text, flag, Placeholder: "e.g. rockyou.txt (a text file of guesses)");

    public static ToolField Ports() =>
        new("ports", "Which ports", FieldKind.Text, "-p", Placeholder: "e.g. 22, 80, 443");

    public static ToolField Verbose() =>
        Flag("verbose", "Show extra detail", "-v");

    public static ToolField Threads(string flag = "-t") =>
        new("threads", "How many at once", FieldKind.Number, flag, Placeholder: "10");

    public static ToolField Iface() =>
        new("iface", "Which network adapter", FieldKind.Text, "-i", Placeholder: "e.g. Wi-Fi or Ethernet name");

    public static ToolField InputFile(string label = "File to open") =>
        new("input", label, FieldKind.Text, "", Required: true, Placeholder: "e.g. a capture or firmware file", Positional: true);
}
