using System.Linq;
using System.Windows;
using Seraphim.Engine;

namespace Seraphim.App;

public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);
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
