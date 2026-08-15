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
}
