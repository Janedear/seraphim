using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class JobTests
{
    private static readonly Scope Lab = Scope.Parse("127.0.0.1,10.0.0.0/8,lab.local");

    [Fact]
    public async Task Job_refuses_out_of_scope_before_launch()
    {
        var spec = Catalog.ById("nmap")!;
        var values = new Dictionary<string, string> { ["target"] = "8.8.8.8", ["fast"] = "true" };
        var result = await Job.RunAsync(spec, values, Lab);
        Assert.False(result.Ok);
        Assert.Contains("scope", result.Reason, StringComparison.OrdinalIgnoreCase);
        Assert.False(result.Launched);
    }

    [Fact]
    public async Task Job_nmap_lab_ip_returns_real_output()
    {
        var spec = Catalog.ById("nmap")!;
        var values = CommandBuilder.WithPreset(spec, "Quick");
        values["target"] = "127.0.0.1";
        values["connect"] = "true";
        var result = await Job.RunAsync(spec, values, Lab);
        Assert.True(result.Ok, result.Reason + "\n" + result.Output);
        Assert.False(string.IsNullOrWhiteSpace(result.Output));
        Assert.DoesNotContain("isn't ready yet", result.Output, StringComparison.OrdinalIgnoreCase);
    }
}
