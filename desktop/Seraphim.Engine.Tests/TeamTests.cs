using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class TeamTests
{
    [Fact]
    public void Parse_red_is_red()
    {
        Assert.Equal(Team.Red, TeamMode.Parse("red"));
    }

    [Fact]
    public void Parse_anything_else_is_blue()
    {
        Assert.Equal(Team.Blue, TeamMode.Parse("blue"));
        Assert.Equal(Team.Blue, TeamMode.Parse(null));
        Assert.Equal(Team.Blue, TeamMode.Parse("nope"));
    }

    [Fact]
    public void Blue_accent_is_cyan_not_red()
    {
        var a = Accent.For(Team.Blue);
        Assert.Equal("#22D3EE", a.Hex);
        Assert.NotEqual(Accent.For(Team.Red).Hex, a.Hex);
    }

    [Fact]
    public void Red_accent_is_red()
    {
        Assert.Equal("#FF2A2A", Accent.For(Team.Red).Hex);
    }
}
