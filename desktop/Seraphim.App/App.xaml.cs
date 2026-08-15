using System.Linq;
using System.Windows;
using Seraphim.Engine;

namespace Seraphim.App;

public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);
        DispatcherUnhandledException += (_, ev) =>
        {
            CrashLog.Write(ev.Exception);
            MessageBox.Show(
                ev.Exception.Message + "\n\nLogged to %LocalAppData%\\Seraphim\\crash.log",
                "Seraphim",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
            ev.Handled = true;
        };
        AppDomain.CurrentDomain.UnhandledException += (_, ev) =>
        {
            if (ev.ExceptionObject is Exception ex)
                CrashLog.Write(ex);
        };

        ShutdownMode = ShutdownMode.OnExplicitShutdown;

        var setup = e.Args.Any(a => a.Equals("--setup", StringComparison.OrdinalIgnoreCase));
        Window window = setup || ToolboxSetup.NeedsUi()
            ? new SetupWindow(autoStart: setup)
            : new MainWindow();
        MainWindow = window;
        ShutdownMode = ShutdownMode.OnMainWindowClose;
        window.Show();
    }
}
