using Xunit;

namespace Seraphim.Engine.Tests;

public class DemoTreeTests
{
    [Fact]
    public void Retired_spa_is_not_at_the_repo_root()
    {
        var root = RepoRoot();
        Assert.True(Directory.Exists(Path.Combine(root, "desktop")));
        Assert.True(File.Exists(Path.Combine(root, "desktop", "Seraphim.sln")));
        Assert.False(Directory.Exists(Path.Combine(root, "src")), "retired SPA still at src/");
        Assert.False(Directory.Exists(Path.Combine(root, "server")), "retired server still at root");
        Assert.False(Directory.Exists(Path.Combine(root, "functions")), "retired functions still at root");
        Assert.False(File.Exists(Path.Combine(root, "package.json")), "Vite package.json still at root");
        Assert.False(File.Exists(Path.Combine(root, "vite.config.js")));
        Assert.False(Directory.Exists(Path.Combine(root, "quarry")), "retired SPA still in this folder");
        Assert.True(File.Exists(Path.Combine(root, "desktop", "DEMO.md")));
    }

    [Fact]
    public void Demo_script_covers_the_meeting()
    {
        var root = RepoRoot();
        var demo = File.ReadAllText(Path.Combine(root, "desktop", "DEMO.md"));
        Assert.Contains("Forensics", demo);
        Assert.Contains("Exploitation Tools", demo);
        Assert.Contains("127.0.0.1", demo);
        Assert.Contains("Do not invent a scan", demo);
        Assert.Contains("Open Seraphim anyway", demo);
        Assert.Contains("TERMINAL", demo);
        Assert.DoesNotContain("scope refusal", demo);
    }

    private static string RepoRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "desktop", "Seraphim.sln")))
                return dir.FullName;
            dir = dir.Parent;
        }
        throw new DirectoryNotFoundException("Could not find repo root from " + AppContext.BaseDirectory);
    }
}
