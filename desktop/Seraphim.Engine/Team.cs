namespace Seraphim.Engine;

public enum Team
{
    Blue,
    Red,
}

public static class TeamMode
{
    public static Team Parse(string? value) =>
        string.Equals(value, "red", StringComparison.OrdinalIgnoreCase) ? Team.Red : Team.Blue;

    public static string ToStorage(Team team) => team == Team.Red ? "red" : "blue";
}

public readonly record struct Accent(string Hex, string Name)
{
    public static Accent For(Team team) => team == Team.Red
        ? new Accent("#FF2A2A", "red")
        : new Accent("#22D3EE", "cyan");
}
