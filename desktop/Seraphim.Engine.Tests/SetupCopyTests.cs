using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class SetupCopyTests
{
    [Fact]
    public void Wizard_copy_never_names_bundled_installers()
    {
        var banned = new[] { "kali", "ollama", "nmap", "wsl", "winget", "toolbox", "hydra", "nikto" };
        foreach (var line in SetupCopy.UserVisible)
        {
            var lower = line.ToLowerInvariant();
            foreach (var word in banned)
                Assert.DoesNotContain(word, lower);
        }
    }

    [Fact]
    public void Skip_lets_them_open_the_workbench()
    {
        Assert.Equal("Open Seraphim anyway", SetupCopy.Skip);
        Assert.Contains(SetupCopy.Skip, SetupCopy.UserVisible);
        Assert.Contains(SetupCopy.SkipHint, SetupCopy.UserVisible);
        Assert.DoesNotContain("install", SetupCopy.Skip, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Red_is_signal_red_not_maroon()
    {
        Assert.Equal("#FF2A2A", Accent.For(Team.Red).Hex);
        Assert.NotEqual("#F87171", Accent.For(Team.Red).Hex);
        Assert.NotEqual("#800000", Accent.For(Team.Red).Hex);
    }
}
