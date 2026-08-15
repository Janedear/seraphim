using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class ToolLocatorTests
{
    [Fact]
    public void Prefers_a_windows_binary_on_path()
    {
        var dir = Path.Combine(Path.GetTempPath(), "seraphim-locator-" + Guid.NewGuid().ToString("n")[..8]);
        Directory.CreateDirectory(dir);
        var fake = Path.Combine(dir, "nmap.exe");
        File.WriteAllText(fake, "");
        try
        {
            var launch = ToolLocator.Resolve("nmap", ["-F", "10.0.0.1"], new ToolLocatorOptions
            {
                Path = dir,
                WslReady = true,
            });
            Assert.True(launch.Found);
            Assert.False(launch.ViaWsl);
            Assert.Equal(fake, launch.FileName);
        }
        finally
        {
            Directory.Delete(dir, true);
        }
    }

    [Fact]
    public void Falls_back_to_kali_wsl_when_not_on_path()
    {
        var launch = ToolLocator.Resolve("hydra", ["-l", "admin", "ssh://10.0.0.1"], new ToolLocatorOptions
        {
            Path = "C:\\no-such-path",
            WslReady = true,
            WslExe = "C:\\Windows\\System32\\wsl.exe",
        });
        Assert.True(launch.Found);
        Assert.True(launch.ViaWsl);
        Assert.Contains("kali-linux", launch.Arguments);
        Assert.Contains("hydra", launch.Arguments);
        Assert.Contains("-l", launch.Arguments);
    }

    [Fact]
    public void Missing_when_no_windows_binary_and_no_wsl()
    {
        var launch = ToolLocator.Resolve("sqlmap", ["-u", "http://10.0.0.1/"], new ToolLocatorOptions
        {
            Path = "C:\\no-such-path",
            WslReady = false,
        });
        Assert.False(launch.Found);
    }

    [Fact]
    public void Kali_listing_survives_utf16_nulls()
    {
        var raw = "k\0a\0l\0i\0-\0l\0i\0n\0u\0x\0\r\0\n\0";
        Assert.True(WslKali.ListingHasDistro(raw, "kali-linux"));
        Assert.False(WslKali.ListingHasDistro("Ubuntu\r\nDebian\r\n", "kali-linux"));
    }

    [Fact]
    public void Setup_script_bundles_the_workbench()
    {
        var text = ToolboxSetup.ScriptBody;
        Assert.Contains("Insecure.Nmap", text);
        Assert.Contains("Ollama.Ollama", text);
        Assert.Contains("kali-linux", text);
        Assert.Contains("kali-tools-top10", text);
        Assert.Contains("STEP:", text);
        Assert.Contains("DONE", text);
        Assert.Equal("Setup-Seraphim.ps1", ToolboxSetup.ScriptFileName);
    }
}
