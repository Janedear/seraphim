namespace Seraphim.Engine;

public static class AuthorizedUse
{
    public const string Headline = "Authorized use only";
    public const string Terms =
        "Seraphim runs real scans and attack tooling against whatever you type in. Use it only on authorized systems you own or have written permission to test. You are responsible for staying inside that engagement. Declining closes the app.";
    public const string Check = "I will only use this on authorized targets";
    public const string Continue = "Continue";
    public const string Decline = "Decline";
    public const string Token = "accepted";

    public static string DefaultPath =>
        Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Seraphim",
            "authorized.txt");

    public static bool IsAccepted(string? path = null)
    {
        path ??= DefaultPath;
        try
        {
            return File.Exists(path)
                   && File.ReadAllText(path).Trim().Equals(Token, StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }

    public static void Accept(string? path = null)
    {
        path ??= DefaultPath;
        var dir = Path.GetDirectoryName(path);
        if (!string.IsNullOrEmpty(dir))
            Directory.CreateDirectory(dir);
        File.WriteAllText(path, Token);
    }
}
