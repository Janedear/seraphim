using System.Net;

namespace Seraphim.Engine;

public sealed class Scope
{
    private readonly List<string> _cidrs = [];
    private readonly List<string> _domains = [];

    public string Raw { get; }

    public static string HomeLab { get; } =
        "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,127.0.0.1,localhost,lab.local";

    private Scope(string raw) => Raw = raw;

    public static Scope Parse(string raw)
    {
        var scope = new Scope(raw);
        foreach (var part in raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (part.Contains('/')) scope._cidrs.Add(part);
            else if (IPAddress.TryParse(part, out _)) scope._cidrs.Add(part + "/32");
            else scope._domains.Add(part.ToLowerInvariant());
        }
        return scope;
    }

    public bool Allows(string target)
    {
        if (IPAddress.TryParse(target, out var ip) && ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
        {
            var value = ToUint(ip);
            foreach (var cidr in _cidrs)
            {
                if (CidrContains(cidr, value)) return true;
            }
            return false;
        }

        var host = target.ToLowerInvariant();
        return _domains.Any(d => host == d || host.EndsWith("." + d, StringComparison.Ordinal));
    }

    private static uint ToUint(IPAddress ip)
    {
        var b = ip.GetAddressBytes();
        if (BitConverter.IsLittleEndian) Array.Reverse(b);
        return BitConverter.ToUInt32(b, 0);
    }

    private static bool CidrContains(string cidr, uint ip)
    {
        var bits = 32;
        var networkText = cidr;
        var slash = cidr.IndexOf('/');
        if (slash > 0)
        {
            networkText = cidr[..slash];
            bits = int.Parse(cidr[(slash + 1)..]);
        }
        if (!IPAddress.TryParse(networkText, out var netIp)) return false;
        var network = ToUint(netIp);
        var mask = bits == 0 ? 0u : uint.MaxValue << (32 - bits);
        return (ip & mask) == (network & mask);
    }
}
