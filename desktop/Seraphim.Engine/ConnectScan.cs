using System.Net.Sockets;
using System.Text;

namespace Seraphim.Engine;

public sealed record ConnectHit(int Port, string State);

public static class ConnectScan
{
    public static readonly int[] CommonPorts =
        [21, 22, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080, 8443];

    public static async Task<IReadOnlyList<ConnectHit>> RunAsync(string host, IReadOnlyList<int> ports, TimeSpan timeout)
    {
        var tasks = ports.Select(port => Probe(host, port, timeout));
        return await Task.WhenAll(tasks);
    }

    public static string Format(IEnumerable<ConnectHit> hits)
    {
        var sb = new StringBuilder();
        sb.AppendLine("connect-scan (built-in TCP). Not nmap.");
        foreach (var h in hits.OrderBy(h => h.Port))
            sb.AppendLine($"{h.Port,-6} {h.State}");
        return sb.ToString();
    }

    private static async Task<ConnectHit> Probe(string host, int port, TimeSpan timeout)
    {
        try
        {
            using var cts = new CancellationTokenSource(timeout);
            using var client = new TcpClient();
            await client.ConnectAsync(host, port, cts.Token);
            return new ConnectHit(port, client.Connected ? "open" : "closed");
        }
        catch (OperationCanceledException)
        {
            return new ConnectHit(port, "filtered");
        }
        catch
        {
            return new ConnectHit(port, "closed");
        }
    }
}
