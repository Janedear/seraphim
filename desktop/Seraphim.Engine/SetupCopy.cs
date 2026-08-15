namespace Seraphim.Engine;

public static class SetupCopy
{
    public const string WindowTitle = "Seraphim Setup";
    public const string Headline = "Install Seraphim";
    public const string Blurb = "This sets up the workbench on this PC.";
    public const string Action = "Install Seraphim";
    public const string Installing = "Installing Seraphim…";
    public const string Preparing = "Preparing the workbench…";
    public const string Lab = "Setting up the lab…";
    public const string Finishing = "Finishing up…";
    public const string Done = "Seraphim is installed.";
    public const string Open = "Open Seraphim";
    public const string RebootHint = "Windows may restart to finish. Open Seraphim after that.";
    public const string Permission = "Windows needs permission to install Seraphim.";
    public const string Failed = "Setup didn't finish. Try Install Seraphim again.";
    public const string MissingTool = "{0} isn't ready yet. We didn't invent a result.";
    public const string ScanFallback = "This scan isn't ready yet. Checking common ports the built-in way.";
    public const string InsideOff = "  AI: Off";
    public const string InsideOn = "  AI: Inside · nothing leaves";
    public const string InsideDown = "Inside isn't ready yet. Nothing left this PC.";

    public static string ForStep(int step) => step switch
    {
        1 => Installing,
        2 => Preparing,
        3 => Lab,
        _ => Finishing,
    };

    public static IEnumerable<string> UserVisible =>
    [
        WindowTitle, Headline, Blurb, Action, Installing, Preparing, Lab, Finishing,
        Done, Open, RebootHint, Permission, Failed, MissingTool, ScanFallback,
        InsideOff, InsideOn, InsideDown,
        AuthorizedUse.Headline, AuthorizedUse.Terms, AuthorizedUse.Check,
        AuthorizedUse.Continue, AuthorizedUse.Decline,
    ];
}
