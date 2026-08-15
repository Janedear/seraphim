using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class LiveLabSmokeTests
{
    private static readonly Scope Lab = Scope.Parse("127.0.0.1,10.0.0.0/8,lab.local");

    [Fact]
    public void Recon_agent_fills_nmap_for_localhost()
    {
        var proposal = AgentTurn.Parse(
            """{"action":"propose","say":"quick look at this PC","tool":"nmap","values":{"target":"127.0.0.1","fast":"true"}}""");
        var d = AgentGuard.Review(AgentRoster.Recon, proposal, Lab, Team.Blue);
        Assert.True(d.ApplyForm, d.Reason);
        Assert.False(d.AutoRun);
        Assert.Equal("127.0.0.1", d.Values["target"]);
    }

    [Fact]
    public async Task Connect_scan_localhost_returns_rows()
    {
        var hits = await ConnectScan.RunAsync("127.0.0.1", ConnectScan.CommonPorts, TimeSpan.FromMilliseconds(500));
        Assert.Equal(ConnectScan.CommonPorts.Length, hits.Count);
        Assert.Contains(hits, h => h.State is "open" or "closed" or "filtered");
        var text = ConnectScan.Format(hits);
        Assert.Contains("built-in TCP", text);
    }

    [Fact]
    public async Task Inside_ping_is_honest_when_ollama_is_down()
    {
        var inside = new InsideClient("http://127.0.0.1:9");
        Assert.False(await inside.PingAsync());
    }

    [Fact]
    public async Task Ollama_inside_replies_on_loopback()
    {
        var inside = new InsideClient("http://127.0.0.1:11434");
        if (!await inside.PingAsync())
            return;
        var reply = await inside.CompleteAsync(
            "JSON only. Propose nmap quick look at 127.0.0.1.",
            session: null,
            system: AgentGuard.SystemPrompt(AgentRoster.Recon));
        Assert.False(string.IsNullOrWhiteSpace(reply));
        var decision = AgentGuard.Review(
            AgentRoster.Recon,
            AgentTurn.Parse(reply),
            Lab,
            Team.Blue);
        Assert.False(string.IsNullOrWhiteSpace(decision.Say) && string.IsNullOrWhiteSpace(reply));
    }

    [Fact]
    public void Kali_core_tools_are_on_the_workbench()
    {
        if (!WslKali.IsReady())
            return;
        foreach (var exe in WslKali.CoreTools)
            Assert.True(WslKali.HasBinary(exe), exe + " missing in kali-linux");
    }
}
