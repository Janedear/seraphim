namespace Seraphim.Engine;

public static class ScanCommand
{
    public static string[] Arguments(string preset, string target)
    {
        var spec = Catalog.ById("nmap") ?? throw new InvalidOperationException("nmap is missing from the catalog.");
        var values = CommandBuilder.WithPreset(spec, preset);
        values["target"] = target;
        return CommandBuilder.Build(spec, values);
    }
}
