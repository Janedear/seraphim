using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class CommandPlainTests
{
    [Fact]
    public void Nmap_quick_is_english_not_flags()
    {
        var spec = Catalog.ById("nmap")!;
        var values = CommandBuilder.WithPreset(spec, "Quick");
        values["target"] = "10.0.0.1";
        var text = CommandPlain.Describe(spec, values);
        Assert.Contains("10.0.0.1", text);
        Assert.DoesNotContain("-F", text);
        Assert.DoesNotContain("nmap ", text, StringComparison.Ordinal);
        Assert.Contains("Nmap", text);
    }

    [Fact]
    public void Unchecked_options_stay_out_of_the_sentence()
    {
        var spec = Catalog.ById("nmap")!;
        var text = CommandPlain.Describe(spec, new Dictionary<string, string>
        {
            ["target"] = "10.1.2.3",
            ["os"] = "false",
            ["service"] = "false",
        });
        Assert.Contains("10.1.2.3", text);
        Assert.DoesNotContain("operating system", text, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("-O", text);
    }

    [Fact]
    public void Sqlmap_mentions_the_website_not_dash_u()
    {
        var spec = Catalog.ById("sqlmap")!;
        var text = CommandPlain.Describe(spec, new Dictionary<string, string>
        {
            ["url"] = "http://10.0.0.1/item?id=1",
            ["batch"] = "true",
        });
        Assert.Contains("http://10.0.0.1/item?id=1", text);
        Assert.DoesNotContain("-u", text);
        Assert.DoesNotContain("--batch", text);
    }

    [Fact]
    public void Strips_flag_parentheses_from_labels()
    {
        Assert.Equal("Fast scan", CommandPlain.PlainLabel("Fast scan (-F)"));
    }
}
