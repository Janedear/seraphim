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
    public void Full_kali_catalog_is_on_both_teams()
    {
        foreach (var id in new[] { "hydra", "msfconsole", "sqlmap", "volatility3", "nmap" })
        {
            Assert.Contains(Catalog.ToolsFor(Team.Blue), t => t.Id == id);
            Assert.Contains(Catalog.ToolsFor(Team.Red), t => t.Id == id);
        }
        Assert.Contains(Catalog.CategoriesFor(Team.Blue), c => c == "Exploitation Tools");
        Assert.Contains(Catalog.CategoriesFor(Team.Blue), c => c == "Password Attacks");
        Assert.Contains(Catalog.CategoriesFor(Team.Red), c => c == "Forensics");
        Assert.Equal(Catalog.ToolsFor(Team.Blue).Count, Catalog.Tools.Count);
        Assert.Equal(Catalog.ToolsFor(Team.Red).Count, Catalog.Tools.Count);
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
    public void Blue_and_red_are_chrome_not_a_lock()
    {
        Assert.Equal(Catalog.ToolsFor(Team.Blue).Count, Catalog.ToolsFor(Team.Red).Count);
        Assert.Equal(Catalog.CategoriesFor(Team.Blue).Count, Catalog.CategoriesFor(Team.Red).Count);
    }

    [Fact]
    public void ToolsIn_does_not_hide_by_team()
    {
        Assert.Contains(Catalog.ToolsIn("Password Attacks", Team.Blue), t => t.Id == "hydra");
        Assert.Contains(Catalog.ToolsIn("Password Attacks", Team.Red), t => t.Id == "hydra");
        Assert.Contains(Catalog.ToolsIn("Information Gathering", Team.Blue), t => t.Id == "nmap");
    }

    [Fact]
    public void Home_category_is_forensics_for_blue_and_exploitation_for_red()
    {
        Assert.Equal("Forensics", Catalog.HomeCategory(Team.Blue));
        Assert.Equal("Exploitation Tools", Catalog.HomeCategory(Team.Red));
        Assert.Contains(Catalog.CategoriesFor(Team.Blue), c => c == Catalog.HomeCategory(Team.Blue));
        Assert.Contains(Catalog.CategoriesFor(Team.Red), c => c == Catalog.HomeCategory(Team.Red));
        Assert.NotEqual(Catalog.HomeCategory(Team.Blue), Catalog.HomeCategory(Team.Red));
    }

    [Fact]
    public void Console_frameworks_need_a_live_terminal()
    {
        Assert.True(Catalog.ById("kali-shell")!.Interactive);
        Assert.Equal("bash", Catalog.ById("kali-shell")!.Executable);
        Assert.True(Catalog.ById("msfconsole")!.Interactive);
        Assert.True(Catalog.ById("bettercap")!.Interactive);
        Assert.False(Catalog.ById("nmap")!.Interactive);
        Assert.False(Catalog.ById("sqlmap")!.Interactive);
    }

    [Fact]
    public void Core_forty_have_operator_forms()
    {
        Assert.Equal(40, Catalog.CoreForty.Count);
        Assert.Equal(40, Catalog.CoreForty.Distinct(StringComparer.OrdinalIgnoreCase).Count());
        foreach (var id in Catalog.CoreForty)
        {
            var spec = Catalog.ById(id);
            Assert.NotNull(spec);
            Assert.True(spec!.Fields.Count >= 1, id);
            if (!spec.Interactive)
                Assert.True(spec.Fields.Count >= 6, $"{id} has {spec.Fields.Count} fields");
        }
    }
}
