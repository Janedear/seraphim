using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class RunnerTests
{
    private static readonly Scope Scope = Scope.Parse("10.0.0.0/8,lab.local");

    [Fact]
    public void Allows_nmap_against_in_scope_ip()
    {
        var r = ToolRunner.Plan("nmap", new[] { "-sV", "10.1.2.3" }, Scope);
        Assert.True(r.Allowed);
        Assert.Equal("nmap", r.Executable);
    }

    [Fact]
    public void Rejects_cmd_exe()
    {
        var r = ToolRunner.Plan("cmd.exe", new[] { "/c", "whoami" }, Scope);
        Assert.False(r.Allowed);
    }

    [Fact]
    public void Allows_public_internet_targets()
    {
        var r = ToolRunner.Plan("nmap", new[] { "8.8.8.8" }, Scope);
        Assert.True(r.Allowed, r.Reason);
        Assert.DoesNotContain("scope", r.Reason, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Allows_hydra()
    {
        var r = ToolRunner.Plan("hydra", new[] { "-l", "admin", "-P", "rockyou.txt", "ssh://10.1.2.3" }, Scope);
        Assert.True(r.Allowed);
    }

    [Fact]
    public void Wordlist_files_are_not_scope_targets()
    {
        var r = ToolRunner.Plan("gobuster", new[] { "dir", "-u", "http://10.1.2.3/", "-w", "rockyou.txt" }, Scope);
        Assert.True(r.Allowed);
    }

    [Fact]
    public void Url_with_a_public_host_is_allowed()
    {
        var r = ToolRunner.Plan("sqlmap", new[] { "-u", "http://8.8.8.8/item?id=1" }, Scope);
        Assert.True(r.Allowed, r.Reason);
    }

    [Fact]
    public void Open_scope_does_not_block_public_targets()
    {
        Assert.True(Scope.Open.Allows("8.8.8.8"));
        Assert.True(Scope.Open.Allows("1.1.1.1"));
        Assert.True(Scope.Parse("10.0.0.0/8").Allows("8.8.8.8"));
    }

    [Fact]
    public void Example_text_is_not_treated_as_a_host()
    {
        Assert.Null(ToolRunner.ExtractHost("e.g. 22, 80, 443"));
        Assert.Null(ToolRunner.ExtractHost("default,safe"));
        Assert.Null(ToolRunner.ExtractHost("20"));
    }

    [Fact]
    public void Nmap_quick_against_home_lan_is_allowed()
    {
        var spec = Catalog.ById("nmap")!;
        var values = CommandBuilder.WithPreset(spec, "Quick");
        values["target"] = "192.168.1.50";
        var args = CommandBuilder.Build(spec, values);
        var r = ToolRunner.Plan("nmap", args, Scope.Parse(Scope.HomeLab));
        Assert.True(r.Allowed, r.Reason);
    }

    [Fact]
    public void Allowlist_covers_every_catalog_binary()
    {
        foreach (var tool in Catalog.Tools)
        {
            if (tool.BuiltIn) continue;
            Assert.True(
                ToolRunner.Allowlist.Contains(tool.Executable),
                $"{tool.Id} executable '{tool.Executable}' is not allowlisted");
        }
    }
}
