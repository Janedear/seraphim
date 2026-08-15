using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class LanguageModelTests
{
    [Fact]
    public void Off_does_not_call_a_vendor()
    {
        var lm = LanguageModel.Off();
        Assert.Equal(ModelKind.Off, lm.Kind);
        Assert.False(lm.LeavesMachine);
    }

    [Fact]
    public void Inside_does_not_leave_the_machine()
    {
        var lm = LanguageModel.Inside("http://127.0.0.1:11434");
        Assert.Equal(ModelKind.Inside, lm.Kind);
        Assert.False(lm.LeavesMachine);
    }

    [Fact]
    public void Byo_anthropic_is_marked_as_leaving()
    {
        var lm = LanguageModel.Byo(LlmProvider.Anthropic, "sk-test", null);
        Assert.True(lm.LeavesMachine);
        Assert.Equal(LlmProvider.Anthropic, lm.Provider);
    }

    [Fact]
    public void First_ollama_model_name_is_read_from_tags()
    {
        var name = InsideClient.FirstModelName("""{"models":[{"name":"llama3.2:1b"}]}""");
        Assert.Equal("llama3.2:1b", name);
    }

    [Fact]
    public void Larger_local_model_wins_over_smoke_test_1b()
    {
        var name = InsideClient.FirstModelName(
            """{"models":[{"name":"llama3.2:1b"},{"name":"llama3.1:8b"}]}""");
        Assert.Equal("llama3.1:8b", name);
        Assert.Equal("llama3.2:3b", InsideClient.FirstModelName(
            """{"models":[{"name":"llama3.2:1b"},{"name":"llama3.2:3b"}]}"""));
    }

    [Fact]
    public void Preferred_inside_model_is_eight_billion_class()
    {
        Assert.Contains("8b", InsideClient.PreferredModel, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("1b", InsideClient.PreferredModel, StringComparison.OrdinalIgnoreCase);
    }
}
