namespace Seraphim.Engine;

public sealed class Scope
{
    public string Raw { get; }

    public static Scope Open { get; } = Parse("");

    public static string HomeLab { get; } =
        "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,127.0.0.1,localhost,lab.local";

    private Scope(string raw) => Raw = raw;

    public static Scope Parse(string raw) => new(raw);

    public bool Allows(string target) => true;
}
