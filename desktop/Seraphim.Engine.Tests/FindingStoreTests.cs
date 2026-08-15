using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class FindingStoreTests
{
    [Fact]
    public void Sqlite_store_survives_a_reopen()
    {
        var path = Path.Combine(Path.GetTempPath(), "seraphim-findings-" + Guid.NewGuid().ToString("n")[..8] + ".sqlite");
        try
        {
            var a = FindingStore.Open(path);
            var row = a.Add("nmap 127.0.0.1", "port 80 closed");
            var b = FindingStore.Open(path);
            Assert.Contains(b.All, f => f.Id == row.Id && f.Title == "nmap 127.0.0.1");
            Assert.Contains(b.All, f => f.Evidence.Contains("port 80"));
        }
        finally
        {
            try { File.Delete(path); } catch { /* temp */ }
        }
    }

    [Fact]
    public void Report_outline_lists_finding_titles()
    {
        var path = Path.Combine(Path.GetTempPath(), "seraphim-findings-" + Guid.NewGuid().ToString("n")[..8] + ".sqlite");
        try
        {
            var store = FindingStore.Open(path);
            store.Add("Open SSH", "22/tcp open");
            var md = EngagementReport.Outline(store.All);
            Assert.Contains("Open SSH", md);
            Assert.Contains("22/tcp open", md);
        }
        finally
        {
            try { File.Delete(path); } catch { /* temp */ }
        }
    }
}
