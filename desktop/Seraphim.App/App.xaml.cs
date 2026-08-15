using System.Linq;
using System.Windows;
using Seraphim.Engine;

namespace Seraphim.App;

public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);
        var setup = e.Args.Any(a => a.Equals("--setup", StringComparison.OrdinalIgnoreCase));
        if (setup || ToolboxSetup.NeedsUi())
            new SetupWindow(autoStart: setup).Show();
        else
            new MainWindow().Show();
    }
}
