using System.Net;
using System.Net.Http;
using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class OpsTests
{
    [Fact]
    public void Version_is_semver()
    {
        Assert.Equal("0.1.0", AppVersion.Current);
        Assert.Contains("Janedear/seraphim", AppVersion.ReleasesApi);
    }

    [Fact]
    public void Newer_tag_is_detected()
    {
        Assert.True(UpdateCheck.IsNewer("0.1.0", "v0.2.0"));
        Assert.False(UpdateCheck.IsNewer("0.1.0", "0.1.0"));
        Assert.False(UpdateCheck.IsNewer("0.2.0", "v0.1.9"));
    }

    [Fact]
    public async Task Update_query_reads_github_tag()
    {
        var handler = new StubHandler("""{"tag_name":"v0.2.0","html_url":"https://github.com/Janedear/seraphim/releases/tag/v0.2.0"}""");
        var info = await UpdateCheck.QueryAsync(handler);
        Assert.True(info.Available);
        Assert.Equal("v0.2.0", info.Latest);
        Assert.Contains("releases", info.Url);
    }

    [Fact]
    public void Crash_log_writes_under_localappdata()
    {
        Assert.Contains("Seraphim", CrashLog.FilePath);
        Assert.EndsWith("crash.log", CrashLog.FilePath);
        CrashLog.Write(new InvalidOperationException("probe"));
        Assert.True(File.Exists(CrashLog.FilePath));
        Assert.Contains("probe", File.ReadAllText(CrashLog.FilePath));
    }

    private sealed class StubHandler : HttpMessageHandler
    {
        private readonly string _json;
        public StubHandler(string json) => _json = json;

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(_json) });
    }
}
