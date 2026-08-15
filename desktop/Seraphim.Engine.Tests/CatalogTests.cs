using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class CatalogTests
{
    [Fact]
    public void Information_gathering_lists_nmap()
    {
        var tools = Catalog.ToolsIn("Information Gathering");
        Assert.Contains(tools, t => t.Id == "nmap");
    }

    [Fact]
    public void Unknown_category_is_empty()
    {
        Assert.Empty(Catalog.ToolsIn("Nope"));
    }

    [Fact]
    public void Every_category_has_clickable_tools()
    {
        foreach (var category in Catalog.Categories)
        {
            var tools = Catalog.ToolsIn(category);
            Assert.True(tools.Count >= 8, $"{category} has {tools.Count} tools; Kali-menu scale needs many clickable entries");
        }
    }

    [Fact]
    public void Catalog_is_kali_menu_scale()
    {
        Assert.True(Catalog.Tools.Count >= 250, $"catalog has {Catalog.Tools.Count} tools");
        Assert.True(Catalog.ToolsIn("Information Gathering").Count >= 40);
        Assert.True(Catalog.ToolsIn("Web Application Analysis").Count >= 30);
        Assert.True(Catalog.ToolsIn("Forensics").Count >= 40);
    }

    [Fact]
    public void Every_tool_has_a_form_schema()
    {
        Assert.Equal(Catalog.Tools.Count, Catalog.Tools.Select(t => t.Id).Distinct().Count());
        foreach (var tool in Catalog.Tools)
        {
            Assert.False(string.IsNullOrWhiteSpace(tool.Name));
            Assert.False(string.IsNullOrWhiteSpace(tool.Summary));
            Assert.NotEmpty(tool.Fields);
            Assert.Contains(tool.Category, Catalog.Categories);
        }
    }

    [Fact]
    public void ById_finds_hydra()
    {
        var hydra = Catalog.ById("hydra");
        Assert.NotNull(hydra);
        Assert.Equal("hydra", hydra!.Executable);
    }

    [Fact]
    public void Blue_menu_hides_offensive_only_tools()
    {
        Assert.DoesNotContain(Catalog.ToolsFor(Team.Blue), t => t.Id == "hydra");
        Assert.DoesNotContain(Catalog.ToolsFor(Team.Blue), t => t.Id == "msfconsole");
        Assert.DoesNotContain(Catalog.ToolsFor(Team.Blue), t => t.Id == "sqlmap");
        Assert.DoesNotContain(Catalog.CategoriesFor(Team.Blue), c => c == "Exploitation Tools");
        Assert.DoesNotContain(Catalog.CategoriesFor(Team.Blue), c => c == "Password Attacks");
    }

    [Fact]
    public void Red_menu_hides_forensics_dashboard()
    {
        Assert.DoesNotContain(Catalog.ToolsFor(Team.Red), t => t.Id == "volatility3");
        Assert.DoesNotContain(Catalog.CategoriesFor(Team.Red), c => c == "Forensics");
        Assert.DoesNotContain(Catalog.CategoriesFor(Team.Red), c => c == "Reporting Tools");
    }

    [Fact]
    public void Shared_tools_appear_on_both_sides()
    {
        Assert.Contains(Catalog.ToolsFor(Team.Blue), t => t.Id == "nmap");
        Assert.Contains(Catalog.ToolsFor(Team.Red), t => t.Id == "nmap");
        Assert.Contains(Catalog.ToolsFor(Team.Red), t => t.Id == "hydra");
        Assert.Contains(Catalog.ToolsFor(Team.Blue), t => t.Category == "Forensics");
    }

    [Fact]
    public void Blue_and_red_menus_are_different_sizes()
    {
        var blue = Catalog.ToolsFor(Team.Blue);
        var red = Catalog.ToolsFor(Team.Red);
        Assert.NotEqual(blue.Count, red.Count);
        Assert.NotEqual(Catalog.CategoriesFor(Team.Blue).Count, Catalog.CategoriesFor(Team.Red).Count);
        Assert.True(blue.Count < Catalog.Tools.Count);
        Assert.True(red.Count < Catalog.Tools.Count);
    }

    [Fact]
    public void ToolsIn_honors_team()
    {
        Assert.Empty(Catalog.ToolsIn("Password Attacks", Team.Blue));
        Assert.Contains(Catalog.ToolsIn("Password Attacks", Team.Red), t => t.Id == "hydra");
        Assert.Contains(Catalog.ToolsIn("Information Gathering", Team.Blue), t => t.Id == "nmap");
    }
}
