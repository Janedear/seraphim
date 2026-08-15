using System.Net;
using System.Net.Http;
using Seraphim.Engine;
using Xunit;

namespace Seraphim.Engine.Tests;

public class HibpTests
{
    [Fact]
    public void Prefix_must_be_five_hex_chars()
    {
        Assert.True(Hibp.IsPrefix("21BD1"));
        Assert.False(Hibp.IsPrefix("21bd"));
        Assert.False(Hibp.IsPrefix("password"));
    }

    [Fact]
    public async Task Lookup_hits_the_range_api()
    {
        var handler = new StubHandler();
        var body = await Hibp.LookupAsync("21BD1", handler);
        Assert.Contains("00A4A8F", body);
        Assert.Equal("https://api.pwnedpasswords.com/range/21BD1", handler.Url);
    }

    private sealed class StubHandler : HttpMessageHandler
    {
        public string? Url { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Url = request.RequestUri?.ToString();
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("00A4A8F:3\r\n0018A45:1"),
            });
        }
    }
}
