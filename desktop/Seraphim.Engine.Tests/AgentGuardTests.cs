using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class AgentGuardTests
{
    private static readonly Scope Lab = Scope.Parse("10.0.0.0/8,lab.local");

    [Fact]
    public void Reporter_cannot_fill_a_tool_form()
    {
        var proposal = AgentTurn.Parse("""{"action":"propose","say":"scan it","tool":"nmap","values":{"target":"10.0.0.1"}}""");
        var d = AgentGuard.Review(AgentRoster.Reporter, proposal, Lab);
        Assert.False(d.ApplyForm);
        Assert.Contains("Reporter", d.Reason);
    }

    [Fact]
    public void Recon_cannot_propose_hydra()
    {
        var proposal = AgentTurn.Parse("""{"action":"propose","say":"spray","tool":"hydra","values":{"target":"ssh://10.0.0.1"}}""");
        var d = AgentGuard.Review(AgentRoster.Recon, proposal, Lab);
        Assert.False(d.ApplyForm);
    }

    [Fact]
    public void Operator_fills_in_scope_nmap_but_does_not_auto_run()
    {
        var proposal = AgentTurn.Parse("""{"action":"propose","say":"quick look","tool":"nmap","values":{"target":"10.1.2.3","fast":"true"}}""");
        var d = AgentGuard.Review(AgentRoster.Operator, proposal, Lab);
        Assert.True(d.ApplyForm);
        Assert.False(d.AutoRun);
        Assert.Equal("nmap", d.Tool!.Id);
        Assert.Equal("10.1.2.3", d.Values["target"]);
    }

    [Fact]
    public void Operator_in_scope_auto_runs_when_requested()
    {
        var proposal = AgentTurn.Parse("""{"action":"propose","say":"quick look","tool":"nmap","values":{"target":"10.1.2.3","fast":"true"}}""");
        var d = AgentGuard.Review(AgentRoster.Operator, proposal, Lab, autoRunInScope: true);
        Assert.True(d.ApplyForm);
        Assert.True(d.AutoRun);
        Assert.Equal("nmap", d.Tool!.Id);
    }

    [Fact]
    public void Out_of_scope_never_auto_runs()
    {
        var proposal = AgentTurn.Parse("""{"action":"propose","say":"no","tool":"nmap","values":{"target":"8.8.8.8"}}""");
        var d = AgentGuard.Review(AgentRoster.Operator, proposal, Lab, autoRunInScope: true);
        Assert.False(d.ApplyForm);
        Assert.False(d.AutoRun);
        Assert.Contains("scope", d.Reason, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Agent_cannot_arm_os_shell()
    {
        var proposal = AgentTurn.Parse("""{"action":"propose","say":"shell","tool":"sqlmap","values":{"url":"http://10.0.0.1/i?id=1","osShell":"true"}}""");
        var d = AgentGuard.Review(AgentRoster.Operator, proposal, Lab);
        Assert.True(d.ApplyForm);
        Assert.NotEqual("true", d.Values.GetValueOrDefault("osShell"));
    }

    [Fact]
    public void Chat_json_is_talk_only()
    {
        var proposal = AgentTurn.Parse("Here you go\n{\"action\":\"chat\",\"say\":\"Use the lab range.\"}\n");
        var d = AgentGuard.Review(AgentRoster.Operator, proposal, Lab);
        Assert.False(d.ApplyForm);
        Assert.Contains("lab range", d.Say);
    }

    [Fact]
    public void Blue_team_cannot_fill_a_red_only_tool()
    {
        var proposal = AgentTurn.Parse("""{"action":"propose","say":"spray","tool":"hydra","values":{"target":"ssh://10.0.0.1"}}""");
        var d = AgentGuard.Review(AgentRoster.Operator, proposal, Lab, Team.Blue);
        Assert.False(d.ApplyForm);
    }

    [Fact]
    public void Plain_prose_is_chat()
    {
        var proposal = AgentTurn.Parse("Just explain the ports.");
        Assert.Equal(AgentAction.Chat, proposal.Action);
    }
}
