using System.Diagnostics;
using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class PtySessionTests
{
    [Fact]
    public void Strip_ansi_leaves_plain_text()
    {
        Assert.Equal("hello", PtySession.StripAnsi("\u001b[31mhello\u001b[0m"));
        Assert.Equal("ok", PtySession.StripAnsi("ok"));
    }

    [Fact]
    public async Task Conpty_whoami_prints_a_user()
    {
        var whoami = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "whoami.exe");
        Assert.True(File.Exists(whoami), whoami);
        using var pty = PtySession.Start(whoami, []);
        var text = await pty.ReadUntilExitAsync(TimeSpan.FromSeconds(8));
        Assert.False(string.IsNullOrWhiteSpace(text), "ConPTY produced no output. " + pty.Debug);
        Assert.Contains("\\", text);
    }
}

public class JobLiveTests
{
    private static readonly Scope Lab = Scope.Parse("127.0.0.1,10.0.0.0/8,lab.local");

    [Fact]
    public async Task Interactive_job_returns_live_session_without_waiting_for_exit()
    {
        var spec = Catalog.ById("nmap")! with { Interactive = true };
        var values = CommandBuilder.WithPreset(spec, "Quick");
        values["target"] = "127.0.0.1";
        values["connect"] = "true";
        var sw = Stopwatch.StartNew();
        var result = await Job.RunAsync(spec, values, Lab);
        sw.Stop();
        try
        {
            Assert.True(result.Ok, result.Reason + "\n" + result.Output);
            Assert.NotNull(result.Live);
            Assert.True(sw.Elapsed < TimeSpan.FromSeconds(2), $"waited {sw.Elapsed}; live jobs must return immediately");
        }
        finally
        {
            result.Live?.Dispose();
        }
    }
}
