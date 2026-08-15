using System.Diagnostics;
using System.Net;

namespace Seraphim.Engine;

public sealed record JobResult(bool Ok, string Output, string Reason, bool Launched = false);

public static class Job
{
    public static async Task<JobResult> RunAsync(
        ToolSpec spec,
        IReadOnlyDictionary<string, string> values,
        Scope scope,
        CancellationToken ct = default)
    {
        if (spec.Id == "hibp")
            return new JobResult(false, "This leak check isn't connected yet. The form is real; nothing left this PC.", "stub");

        if (spec.Id == "recon")
            return await RunRecon(values.GetValueOrDefault("target", ""), scope, ct);

        var args = CommandBuilder.Build(spec, values);
        if (!spec.BuiltIn)
        {
            var plan = ToolRunner.Plan(spec.Executable, args, scope);
            if (!plan.Allowed)
                return new JobResult(false, plan.Reason, plan.Reason);
        }

        var launch = ToolLocator.Resolve(spec.Executable, args);
        if (!launch.Found && spec.Id == "nmap")
        {
            var target = values.GetValueOrDefault("target", "");
            var hits = await ConnectScan.RunAsync(target, ConnectScan.CommonPorts, TimeSpan.FromMilliseconds(400));
            return new JobResult(true, ConnectScan.Format(hits), "connect-scan", Launched: true);
        }

        if (!launch.Found)
            return new JobResult(false, string.Format(SetupCopy.MissingTool, spec.Name), "missing");

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = launch.FileName,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            foreach (var a in launch.Arguments)
                psi.ArgumentList.Add(a);
            using var p = Process.Start(psi);
            if (p is null)
                return new JobResult(false, $"Couldn't start {spec.Name}.", "start-failed");
            var output = await p.StandardOutput.ReadToEndAsync(ct) + await p.StandardError.ReadToEndAsync(ct);
            await p.WaitForExitAsync(ct);
            if (string.IsNullOrWhiteSpace(output))
                output = $"{spec.Name} finished with nothing to show.";
            return new JobResult(true, output, "ok", Launched: true);
        }
        catch (Exception ex)
        {
            return new JobResult(false, ex.Message, ex.Message);
        }
    }

    private static async Task<JobResult> RunRecon(string target, Scope scope, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(target))
            return new JobResult(false, "Type a name to look up.", "empty");
        if (!scope.Allows(target))
            return new JobResult(false, $"'{target}' isn't on the allowed list for this job.", "scope");
        try
        {
            var entry = await Dns.GetHostEntryAsync(target, ct);
            var lines = entry.AddressList.Select(a => a.ToString());
            return new JobResult(true, $"recon {target}\n{string.Join('\n', lines)}", "ok", Launched: true);
        }
        catch (Exception ex)
        {
            return new JobResult(false, ex.Message, ex.Message);
        }
    }
}
