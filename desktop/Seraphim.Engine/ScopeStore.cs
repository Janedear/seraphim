namespace Seraphim.Engine;

public static class ScopeStore
{
    public static string FilePath =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Seraphim", "scope.txt");

    public static string LoadRaw()
    {
        try
        {
            if (File.Exists(FilePath))
            {
                var text = File.ReadAllText(FilePath).Trim();
                if (text.Length > 0) return text;
            }
        }
        catch
        {
            // default
        }
        return Scope.HomeLab;
    }

    public static void Save(string raw)
    {
        var dir = Path.GetDirectoryName(FilePath);
        if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
        File.WriteAllText(FilePath, raw.Trim());
    }
}
