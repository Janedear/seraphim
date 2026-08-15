namespace Seraphim.Engine;

public static class TeamStore
{
    public static string FilePath =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Seraphim", "team.txt");

    public static Team Load()
    {
        try
        {
            if (File.Exists(FilePath))
                return TeamMode.Parse(File.ReadAllText(FilePath).Trim());
        }
        catch
        {
            // default blue
        }
        return Team.Blue;
    }

    public static void Save(Team team)
    {
        var dir = Path.GetDirectoryName(FilePath);
        if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
        File.WriteAllText(FilePath, TeamMode.ToStorage(team));
    }
}
