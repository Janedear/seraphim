using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class CommandBuilderTests
{
    [Fact]
    public void Nmap_quick_preset_matches_scan_command()
    {
        var spec = Catalog.ById("nmap");
        Assert.NotNull(spec);
        var values = CommandBuilder.WithPreset(spec!, "Quick");
        values = new Dictionary<string, string>(values) { ["target"] = "10.0.0.1" };
        var args = CommandBuilder.Build(spec!, values);
        Assert.Contains("-F", args);
        Assert.Contains("10.0.0.1", args);
        Assert.Equal("10.0.0.1", args[^1]);
    }

    [Fact]
    public void Unchecked_flags_are_omitted()
    {
        var spec = Catalog.ById("nmap")!;
        var args = CommandBuilder.Build(spec, new Dictionary<string, string>
        {
            ["target"] = "10.1.2.3",
            ["service"] = "false",
            ["os"] = "false",
        });
        Assert.DoesNotContain("-sV", args);
        Assert.DoesNotContain("-O", args);
        Assert.Contains("10.1.2.3", args);
    }

    [Fact]
    public void Sqlmap_emits_u_flag()
    {
        var spec = Catalog.ById("sqlmap")!;
        var args = CommandBuilder.Build(spec, new Dictionary<string, string>
        {
            ["url"] = "http://10.0.0.1/item?id=1",
            ["batch"] = "true",
        });
        Assert.Contains("-u", args);
        Assert.Contains("http://10.0.0.1/item?id=1", args);
        Assert.Contains("--batch", args);
    }

    [Fact]
    public void Gobuster_prefixes_dir_subcommand()
    {
        var spec = Catalog.ById("gobuster")!;
        var args = CommandBuilder.Build(spec, new Dictionary<string, string>
        {
            ["url"] = "http://10.0.0.1/",
            ["wordlist"] = "/usr/share/wordlists/dirb/common.txt",
        });
        Assert.Equal("dir", args[0]);
        Assert.Contains("-u", args);
        Assert.Contains("-w", args);
    }
}
