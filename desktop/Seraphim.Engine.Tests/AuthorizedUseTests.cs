using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class AuthorizedUseTests
{
    [Fact]
    public void Missing_file_is_not_accepted()
    {
        var path = TempPath();
        try
        {
            Assert.False(AuthorizedUse.IsAccepted(path));
        }
        finally
        {
            TryDelete(path);
        }
    }

    [Fact]
    public void Accept_persists()
    {
        var path = TempPath();
        try
        {
            AuthorizedUse.Accept(path);
            Assert.True(AuthorizedUse.IsAccepted(path));
        }
        finally
        {
            TryDelete(path);
        }
    }

    [Fact]
    public void Terms_require_written_permission()
    {
        var lower = AuthorizedUse.Terms.ToLowerInvariant();
        Assert.Contains("authorized", lower);
        Assert.Contains("written permission", lower);
        Assert.DoesNotContain("declining closes", lower);
        foreach (var word in new[] { "kali", "ollama", "nmap", "wsl", "winget", "hydra", "nikto" })
            Assert.DoesNotContain(word, lower);
    }

    private static string TempPath() =>
        Path.Combine(Path.GetTempPath(), "seraphim-auth-" + Guid.NewGuid().ToString("n")[..8] + ".txt");

    private static void TryDelete(string path)
    {
        try { File.Delete(path); } catch { /* temp */ }
    }
}
