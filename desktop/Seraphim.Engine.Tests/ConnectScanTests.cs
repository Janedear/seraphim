using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class ConnectScanTests
{
    [Fact]
    public async Task Reports_closed_or_open_without_throwing()
    {
        var rows = await ConnectScan.RunAsync("127.0.0.1", [1, 65535], TimeSpan.FromMilliseconds(250));
        Assert.Equal(2, rows.Count);
        Assert.All(rows, r => Assert.True(r.State is "open" or "closed" or "filtered"));
    }

    [Fact]
    public void Format_includes_port_and_state()
    {
        var text = ConnectScan.Format([new ConnectHit(22, "open")]);
        Assert.Contains("22", text);
        Assert.Contains("open", text);
    }
}
