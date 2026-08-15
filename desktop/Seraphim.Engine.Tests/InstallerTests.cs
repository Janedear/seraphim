using Xunit;

namespace Seraphim.Engine.Tests;

public class InstallerTests
{
    [Fact]
    public void Install_script_is_per_user_and_does_not_fake_a_signature()
    {
        var text = Read("Install-Seraphim.ps1");
        Assert.Contains("LOCALAPPDATA", text);
        Assert.Contains(@"Programs\Seraphim", text);
        Assert.Contains("Start Menu", text);
        Assert.Contains("Desktop", text);
        Assert.Contains("Seraphim.lnk", text);
        Assert.Contains("Uninstall-Seraphim.ps1", text);
        Assert.DoesNotContain("signtool", text, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Authenticode", text, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("trusted publisher", text, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Uninstall_script_removes_shortcuts_and_the_app_folder()
    {
        var text = Read("Uninstall-Seraphim.ps1");
        Assert.Contains(@"Programs\Seraphim", text);
        Assert.Contains("Seraphim.lnk", text);
        Assert.Contains("Remove-Item", text);
        Assert.DoesNotContain("signtool", text, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Pack_script_says_the_zip_is_unsigned()
    {
        var text = Read("Pack-Seraphim.ps1");
        Assert.Contains("Unsigned zip", text);
        Assert.Contains("SmartScreen", text);
        Assert.DoesNotContain("signtool", text, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Authenticode", text, StringComparison.OrdinalIgnoreCase);
    }

    private static string Read(string name)
    {
        var path = Path.Combine(AppContext.BaseDirectory, name);
        Assert.True(File.Exists(path), path);
        return File.ReadAllText(path);
    }
}
