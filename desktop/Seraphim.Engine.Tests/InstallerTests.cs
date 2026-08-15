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
    public void Sign_script_only_signs_with_a_real_pfx()
    {
        var text = Read("Sign-Seraphim.ps1");
        Assert.Contains("SERAPHIM_PFX", text);
        Assert.Contains("signtool", text);
        Assert.Contains("Leaving unsigned", text);
        Assert.DoesNotContain("makecert", text, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("New-SelfSignedCertificate", text, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Pack_script_says_the_zip_is_unsigned_without_a_cert()
    {
        var text = Read("Pack-Seraphim.ps1");
        Assert.Contains("Unsigned zip", text);
        Assert.Contains("SmartScreen", text);
        Assert.Contains("Sign-Seraphim.ps1", text);
        Assert.Contains("AppVersion.cs", text);
        var signAt = text.IndexOf("Sign-Seraphim.ps1", StringComparison.Ordinal);
        var zipAt = text.IndexOf("Compress-Archive", StringComparison.Ordinal);
        Assert.True(signAt >= 0 && zipAt > signAt, "sign the exe before the zip");
        Assert.DoesNotContain("makecert", text, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("New-SelfSignedCertificate", text, StringComparison.OrdinalIgnoreCase);
    }

    private static string Read(string name)
    {
        var path = Path.Combine(AppContext.BaseDirectory, name);
        Assert.True(File.Exists(path), path);
        return File.ReadAllText(path);
    }
}
