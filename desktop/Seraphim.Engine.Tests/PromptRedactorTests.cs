using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class PromptRedactorTests
{
    [Fact]
    public void Preview_redacts_ips_and_lists_what_was_removed()
    {
        var preview = PromptRedactor.Preview("Scan 10.0.0.5 and 8.8.8.8 for the client Acme.");
        Assert.DoesNotContain("10.0.0.5", preview.Redacted);
        Assert.DoesNotContain("8.8.8.8", preview.Redacted);
        Assert.Contains(preview.Removed, x => x.Contains("10.0.0.5"));
        Assert.Contains("Acme", preview.Redacted);
    }

    [Fact]
    public void Byo_copy_does_not_claim_disappearing_from_a_vendor()
    {
        var blob = string.Join('\n', VendorCopy.UserVisible).ToLowerInvariant();
        Assert.DoesNotContain("disappear", blob);
        Assert.DoesNotContain("vanish", blob);
        Assert.DoesNotContain("anthropic never", blob);
        Assert.Contains("leaves this pc", blob);
        Assert.Contains("preview", blob);
    }

    [Fact]
    public void Inside_remains_the_default_kind()
    {
        Assert.Equal(ModelKind.Inside, LanguageModel.Default.Kind);
        Assert.False(LanguageModel.Default.LeavesMachine);
    }
}
