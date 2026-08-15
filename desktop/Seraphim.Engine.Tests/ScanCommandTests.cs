using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class ScanCommandTests
{
    [Fact]
    public void Quick_uses_top_ports()
    {
        var args = ScanCommand.Arguments("Quick", "10.0.0.1");
        Assert.Contains("-F", args);
        Assert.Contains("10.0.0.1", args);
    }

    [Fact]
    public void Service_detect_uses_sV()
    {
        var args = ScanCommand.Arguments("Service detect", "10.1.2.3");
        Assert.Contains("-sV", args);
        Assert.Contains("--top-ports", args);
    }

    [Fact]
    public void All_tcp_uses_p()
    {
        var args = ScanCommand.Arguments("All TCP", "10.0.0.9");
        Assert.Contains("-p-", args);
    }
}
