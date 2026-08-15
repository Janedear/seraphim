namespace Seraphim.Engine;

public static class Catalog
{
    public static IReadOnlyList<string> Categories { get; } =
    [
        "Information Gathering",
        "Vulnerability Analysis",
        "Web Application Analysis",
        "Database Assessment",
        "Password Attacks",
        "Wireless Attacks",
        "Reverse Engineering",
        "Exploitation Tools",
        "Sniffing & Spoofing",
        "Post Exploitation",
        "Forensics",
        "Reporting Tools",
        "Social Engineering Tools",
        "Hardware Hacking",
    ];

    private static readonly HashSet<string> BlueOnly = new(StringComparer.OrdinalIgnoreCase)
    {
        "lynis", "gvm", "wireshark", "tshark", "tcpdump",
    };

    private static readonly HashSet<string> RedOnly = new(StringComparer.OrdinalIgnoreCase)
    {
        "bettercap", "ettercap", "responder", "mitmproxy", "dsniff",
    };

    public static IReadOnlyList<ToolSpec> Tools { get; } = StampSides(KaliCatalog.All());

    public static IReadOnlyList<string> CategoriesFor(Team team) =>
        Categories.Where(c => ToolsIn(c, team).Count > 0).ToArray();

    public static IReadOnlyList<ToolSpec> ToolsFor(Team team) =>
        Tools.Where(t => VisibleTo(t, team)).ToArray();

    public static IReadOnlyList<ToolSpec> ToolsIn(string category) =>
        Tools.Where(t => t.Category == category).ToArray();

    public static IReadOnlyList<ToolSpec> ToolsIn(string category, Team team) =>
        Tools.Where(t => t.Category == category && VisibleTo(t, team)).ToArray();

    public static ToolSpec? ById(string id) =>
        Tools.FirstOrDefault(t => t.Id.Equals(id, StringComparison.OrdinalIgnoreCase));

    public static bool VisibleTo(ToolSpec tool, Team team) =>
        tool.Side == TeamSide.Both
        || (team == Team.Blue && tool.Side == TeamSide.Blue)
        || (team == Team.Red && tool.Side == TeamSide.Red);

    public static TeamSide SideFor(string category, string id)
    {
        if (BlueOnly.Contains(id)) return TeamSide.Blue;
        if (RedOnly.Contains(id)) return TeamSide.Red;

        return category switch
        {
            "Exploitation Tools" or "Password Attacks" or "Social Engineering Tools"
                or "Post Exploitation" or "Web Application Analysis" or "Database Assessment"
                or "Wireless Attacks" => TeamSide.Red,
            "Forensics" or "Reporting Tools" => TeamSide.Blue,
            _ => TeamSide.Both,
        };
    }

    private static IReadOnlyList<ToolSpec> StampSides(IReadOnlyList<ToolSpec> tools) =>
        tools.Select(t => t with { Side = SideFor(t.Category, t.Id) }).ToArray();
}
