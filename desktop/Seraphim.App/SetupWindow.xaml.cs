using System.Diagnostics;
using System.IO;
using System.Security.Principal;
using System.Windows;
using Seraphim.Engine;

namespace Seraphim.App;

public partial class SetupWindow : Window
{
    private readonly bool _autoStart;
    private bool _busy;
    private bool _reboot;
    private bool _done;

    public SetupWindow(bool autoStart = false)
    {
        _autoStart = autoStart;
        InitializeComponent();
        Title = SetupCopy.WindowTitle;
        Headline.Text = SetupCopy.Headline;
        Blurb.Text = SetupCopy.Blurb;
        ActionBtn.Content = SetupCopy.Action;
        Loaded += async (_, _) =>
        {
            if (_autoStart)
                await RunSetup();
        };
    }

    private async void OnAction(object sender, RoutedEventArgs e)
    {
        if (_done)
        {
            OpenApp();
            return;
        }
        await RunSetup();
    }

    private async Task RunSetup()
    {
        if (_busy) return;
        if (!IsAdministrator())
        {
            RelaunchElevated();
            return;
        }

        var script = EnsureScript();
        if (script is null)
        {
            Blurb.Text = SetupCopy.Failed;
            return;
        }

        _busy = true;
        ActionBtn.IsEnabled = false;
        Bar.Visibility = Visibility.Visible;
        Headline.Text = SetupCopy.Installing;
        Blurb.Text = SetupCopy.Preparing;

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = $"-NoProfile -ExecutionPolicy Bypass -File \"{script}\"",
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
            };
            using var proc = Process.Start(psi);
            if (proc is null)
            {
                Fail();
                return;
            }

            proc.OutputDataReceived += (_, ev) =>
            {
                if (string.IsNullOrWhiteSpace(ev.Data)) return;
                Dispatcher.Invoke(() => ApplyToken(ev.Data.Trim()));
            };
            proc.ErrorDataReceived += (_, _) => { };
            proc.BeginOutputReadLine();
            proc.BeginErrorReadLine();
            await proc.WaitForExitAsync();
            if (_done || proc.ExitCode == 0)
                Finish();
            else
                Fail();
        }
        catch
        {
            Fail();
        }
    }

    private void ApplyToken(string line)
    {
        if (line.StartsWith("STEP:", StringComparison.OrdinalIgnoreCase)
            && int.TryParse(line.AsSpan(5), out var n))
        {
            Blurb.Text = SetupCopy.ForStep(n);
            return;
        }
        if (line.Equals("REBOOT", StringComparison.OrdinalIgnoreCase))
            _reboot = true;
        if (line.Equals("DONE", StringComparison.OrdinalIgnoreCase))
            _done = true;
    }

    private void Finish()
    {
        ToolboxSetup.MarkComplete();
        _done = true;
        _busy = false;
        Bar.Visibility = Visibility.Collapsed;
        Headline.Text = SetupCopy.Done;
        Blurb.Text = _reboot ? SetupCopy.RebootHint : SetupCopy.Blurb;
        ActionBtn.Content = SetupCopy.Open;
        ActionBtn.IsEnabled = true;
    }

    private void Fail()
    {
        _busy = false;
        Bar.Visibility = Visibility.Collapsed;
        Headline.Text = SetupCopy.Headline;
        Blurb.Text = SetupCopy.Failed;
        ActionBtn.Content = SetupCopy.Action;
        ActionBtn.IsEnabled = true;
    }

    private void OpenApp()
    {
        if (IsAdministrator())
        {
            var exe = Environment.ProcessPath;
            if (!string.IsNullOrEmpty(exe))
            {
                Process.Start(new ProcessStartInfo(exe) { UseShellExecute = true });
                Application.Current.Shutdown();
                return;
            }
        }
        new MainWindow().Show();
        Close();
    }

    private void RelaunchElevated()
    {
        try
        {
            var exe = Environment.ProcessPath;
            if (string.IsNullOrEmpty(exe))
            {
                Blurb.Text = SetupCopy.Permission;
                return;
            }
            Process.Start(new ProcessStartInfo(exe)
            {
                UseShellExecute = true,
                Verb = "runas",
                Arguments = "--setup",
            });
            Application.Current.Shutdown();
        }
        catch
        {
            Blurb.Text = SetupCopy.Permission;
        }
    }

    private static string? EnsureScript()
    {
        var path = Path.Combine(AppContext.BaseDirectory, ToolboxSetup.ScriptFileName);
        try
        {
            if (!File.Exists(path))
                File.WriteAllText(path, ToolboxSetup.ScriptBody);
            return path;
        }
        catch
        {
            return File.Exists(path) ? path : null;
        }
    }

    private static bool IsAdministrator()
    {
        using var id = WindowsIdentity.GetCurrent();
        return new WindowsPrincipal(id).IsInRole(WindowsBuiltInRole.Administrator);
    }
}
