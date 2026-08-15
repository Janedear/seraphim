using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class JobTests
{
    private static readonly Scope Lab = Scope.Parse("127.0.0.1,10.0.0.0/8,lab.local");

    [Fact]
    public void Job_plan_does_not_refuse_a_public_target()
    {
        var spec = Catalog.ById("nmap")!;
        var values = new Dictionary<string, string> { ["target"] = "8.8.8.8", ["fast"] = "true" };
        var args = CommandBuilder.Build(spec, values);
        var plan = ToolRunner.Plan(spec.Executable, args, Lab);
        Assert.True(plan.Allowed, plan.Reason);
        Assert.DoesNotContain("scope", plan.Reason, StringComparison.OrdinalIgnoreCase);
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

    [Fact]
    public async Task Job_hibp_is_not_a_stub()
    {
        var spec = Catalog.ById("hibp")!;
        var result = await Job.RunAsync(spec, new Dictionary<string, string> { ["prefix"] = "nope" }, Lab);
        Assert.False(result.Ok);
        Assert.NotEqual("stub", result.Reason);
        Assert.DoesNotContain("isn't connected yet", result.Output, StringComparison.OrdinalIgnoreCase);
    }
}
