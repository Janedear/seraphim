using System.Windows;
using Seraphim.Engine;

namespace Seraphim.App;

public partial class LicenseWindow : Window
{
    public LicenseWindow()
    {
        InitializeComponent();
        Headline.Text = AuthorizedUse.Headline;
        Terms.Text = AuthorizedUse.Terms;
        AgreeBox.Content = AuthorizedUse.Check;
        DeclineBtn.Content = AuthorizedUse.Decline;
        ContinueBtn.Content = AuthorizedUse.Continue;
        ContinueBtn.IsEnabled = false;
    }

    private void OnAgree(object sender, RoutedEventArgs e) =>
        ContinueBtn.IsEnabled = AgreeBox.IsChecked == true;

    private void OnContinue(object sender, RoutedEventArgs e)
    {
        if (AgreeBox.IsChecked != true) return;
        AuthorizedUse.Accept();
        DialogResult = true;
    }

    private void OnDecline(object sender, RoutedEventArgs e) =>
        DialogResult = false;
}
