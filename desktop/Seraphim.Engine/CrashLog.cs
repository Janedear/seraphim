namespace Seraphim.Engine;

public static class CrashLog
{
    public static string FilePath =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Seraphim", "crash.log");

    public static void Write(Exception ex)
    {
        var dir = Path.GetDirectoryName(FilePath);
        if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
        var block = $"{DateTimeOffset.UtcNow:o}{Environment.NewLine}{ex}{Environment.NewLine}{Environment.NewLine}";
        File.AppendAllText(FilePath, block);
    }
}
