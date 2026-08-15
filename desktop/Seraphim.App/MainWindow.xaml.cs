using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using Seraphim.Engine;

namespace Seraphim.App;

public partial class MainWindow : Window
{
    private Team _team;
    private Scope _scope;
    private readonly FindingStore _findings = FindingStore.OpenDefault();
    private readonly InsideClient _inside = new("http://127.0.0.1:11434");
    private bool _insideUp;
    private ToolSpec _tool = Catalog.Tools[0];
    private readonly Dictionary<string, FrameworkElement> _inputs = new();
    private bool _applyingPreset;
    private PtySession? _live;

    public MainWindow()
    {
        InitializeComponent();
        _team = TeamStore.Load();
        _scope = Scope.Open;
        AgentPick.ItemsSource = AgentRoster.All;
        AgentPick.SelectedIndex = 0;
        FindingsList.ItemsSource = _findings.All;
        CatalogChip.Text = _team == Team.Red
            ? $"  Red · {Catalog.ToolsFor(_team).Count} tools"
            : $"  Blue · {Catalog.ToolsFor(_team).Count} tools";
        ApplyTeam();
        Loaded += async (_, _) =>
        {
            _insideUp = await _inside.EnsureAsync();
            AiChip.Text = _insideUp ? SetupCopy.InsideOn : SetupCopy.InsideOff;
        };
        Closed += (_, _) => StopLive();
    }

    private void OnBlue(object sender, RoutedEventArgs e)
    {
        _team = Team.Blue;
        TeamStore.Save(_team);
        ApplyTeam();
    }

    private void OnRed(object sender, RoutedEventArgs e)
    {
        _team = Team.Red;
        TeamStore.Save(_team);
        ApplyTeam();
    }

    private void OnCategory(object sender, SelectionChangedEventArgs e) => ApplyToolFilter();

    private void OnToolSearch(object sender, TextChangedEventArgs e) => ApplyToolFilter();

    private void ApplyToolFilter()
    {
        if (Categories.SelectedItem is not string cat) return;

        IEnumerable<ToolSpec> query = Catalog.ToolsIn(cat, _team);
        var q = ToolSearch?.Text?.Trim() ?? "";
        if (q.Length > 0)
        {
            query = query.Where(t =>
                ContainsIgnoreCase(t.Name, q) ||
                ContainsIgnoreCase(t.Id, q) ||
                ContainsIgnoreCase(t.Executable, q) ||
                ContainsIgnoreCase(t.Summary, q));
        }

        var list = query.ToList();
        ToolCountLabel.Text = $"TOOLS  ({list.Count})";
        ToolsList.ItemsSource = list;
        if (list.Count == 0) return;

        var keep = list.Find(t => t.Id.Equals(_tool.Id, StringComparison.OrdinalIgnoreCase));
        ToolsList.SelectedItem = keep ?? list[0];
    }

    private static bool ContainsIgnoreCase(string? haystack, string needle) =>
        !string.IsNullOrEmpty(haystack) &&
        haystack.Contains(needle, StringComparison.OrdinalIgnoreCase);

    private void OnTool(object sender, SelectionChangedEventArgs e)
    {
        if (ToolsList.SelectedItem is not ToolSpec spec) return;
        if (spec.Id == _tool.Id && _inputs.Count > 0) return;

        _tool = spec;
        ToolTitle.Text = spec.Name;
        ToolSummary.Text = spec.Summary;
        _applyingPreset = true;
        PresetBox.ItemsSource = spec.PresetNames;
        PresetBox.SelectedIndex = spec.PresetNames.Count > 0 ? 0 : -1;
        PresetBox.Visibility = spec.PresetNames.Count > 0 ? Visibility.Visible : Visibility.Collapsed;
        _applyingPreset = false;
        RenderForm(spec, CommandBuilder.WithPreset(spec, PresetBox.SelectedItem as string));
    }

    private void OnPreset(object sender, SelectionChangedEventArgs e)
    {
        if (_applyingPreset || PresetBox.SelectedItem is not string name) return;
        RenderForm(_tool, CommandBuilder.WithPreset(_tool, name));
    }

    private void RenderForm(ToolSpec spec, IReadOnlyDictionary<string, string> values)
    {
        FormHost.Children.Clear();
        _inputs.Clear();
        foreach (var field in spec.Fields)
        {
            values.TryGetValue(field.Id, out var raw);
            raw ??= field.Default ?? "";

            if (field.Kind == FieldKind.Checkbox)
            {
                var box = new CheckBox
                {
                    Content = CommandPlain.PlainLabel(field.Label),
                    IsChecked = raw.Equals("true", StringComparison.OrdinalIgnoreCase),
                    Tag = field.Id,
                };
                if (!string.IsNullOrEmpty(field.Flag))
                    box.ToolTip = $"Technical name: {field.Flag}";
                box.Checked += (_, _) => RefreshPreview();
                box.Unchecked += (_, _) => RefreshPreview();
                _inputs[field.Id] = box;
                FormHost.Children.Add(box);
                continue;
            }

            FormHost.Children.Add(new TextBlock
            {
                Text = CommandPlain.PlainLabel(field.Label),
                Foreground = new SolidColorBrush(Color.FromRgb(0x94, 0xA3, 0xB8)),
                FontSize = 11,
                Margin = new Thickness(0, 4, 0, 2),
            });
            if (!string.IsNullOrEmpty(field.Placeholder))
            {
                FormHost.Children.Add(new TextBlock
                {
                    Text = field.Placeholder,
                    Foreground = new SolidColorBrush(Color.FromRgb(0x64, 0x74, 0x8B)),
                    FontSize = 10,
                    FontStyle = FontStyles.Italic,
                    Margin = new Thickness(0, 0, 0, 2),
                    TextWrapping = TextWrapping.Wrap,
                });
            }

            if (field.Kind == FieldKind.Select && field.Options is { Count: > 0 })
            {
                var combo = new ComboBox { Tag = field.Id };
                foreach (var opt in field.Options) combo.Items.Add(opt);
                if (!string.IsNullOrEmpty(raw) && combo.Items.Contains(raw)) combo.SelectedItem = raw;
                combo.SelectionChanged += (_, _) => RefreshPreview();
                _inputs[field.Id] = combo;
                FormHost.Children.Add(combo);
                continue;
            }

            var tb = new TextBox { Text = raw, Tag = field.Id };
            if (!string.IsNullOrEmpty(field.Flag))
                tb.ToolTip = $"Technical name: {field.Flag}";
            tb.TextChanged += (_, _) => RefreshPreview();
            _inputs[field.Id] = tb;
            FormHost.Children.Add(tb);
        }

        RefreshPreview();
    }

    private Dictionary<string, string> ReadForm()
    {
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var field in _tool.Fields)
        {
            if (!_inputs.TryGetValue(field.Id, out var el)) continue;
            values[field.Id] = el switch
            {
                CheckBox cb => cb.IsChecked == true ? "true" : "false",
                ComboBox combo => combo.SelectedItem as string ?? "",
                TextBox tb => tb.Text.Trim(),
                _ => "",
            };
        }
        return values;
    }

    private void RefreshPreview()
    {
        if (CommandPreview is null) return;
        var values = ReadForm();
        if (PlainPreview is not null)
            PlainPreview.Text = CommandPlain.Describe(_tool, values);
        CommandPreview.Text = "Technical: " + CommandPlain.CliLine(_tool, values);
    }

    private async void OnRun(object sender, RoutedEventArgs e)
    {
        if (_live is not null)
        {
            StopLive();
            AppendSession("\n[stopped]\n");
            return;
        }

        var result = await Job.RunAsync(_tool, ReadForm(), _scope);
        if (result.Live is not null)
        {
            AttachLive(result);
            return;
        }

        SessionOut.Text = result.Output;
        ScrollSession();
    }

    private void OnSaveFinding(object sender, RoutedEventArgs e)
    {
        var values = ReadForm();
        var hint = values.GetValueOrDefault("target")
                   ?? values.GetValueOrDefault("url")
                   ?? values.GetValueOrDefault("input")
                   ?? "";
        var row = _findings.Add($"{_tool.Name} {hint}".Trim(), SessionOut.Text);
        FindingsList.ItemsSource = null;
        FindingsList.ItemsSource = _findings.All;
        FindingsList.SelectedItem = row;
    }

    private async void OnSend(object sender, RoutedEventArgs e) => await SendInside();

    private async void OnPromptKey(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Enter && Keyboard.Modifiers == ModifierKeys.None)
        {
            e.Handled = true;
            await SendInside();
        }
    }

    private void OnPromptText(object sender, TextChangedEventArgs e)
    {
        if (PromptHint is not null)
            PromptHint.Visibility = string.IsNullOrWhiteSpace(PromptBox.Text) ? Visibility.Visible : Visibility.Collapsed;
    }

    private void AppendSession(string text)
    {
        SessionOut.Text += text;
        ScrollSession();
    }

    private void ScrollSession()
    {
        SessionOut.CaretIndex = SessionOut.Text.Length;
        SessionOut.ScrollToEnd();
    }

    private void AttachLive(JobResult result)
    {
        StopLive();
        _live = result.Live;
        RunBtn.Content = "Stop";
        SessionOut.IsReadOnly = false;
        SessionOut.Text = result.Output + "\n";
        if (_live is null) return;
        _live.Output += OnPtyOutput;
        SessionOut.Focus();
        ScrollSession();
    }

    private void OnPtyOutput(string chunk)
    {
        Dispatcher.Invoke(() =>
        {
            SessionOut.AppendText(chunk);
            ScrollSession();
        });
    }

    private void StopLive()
    {
        if (_live is null) return;
        _live.Output -= OnPtyOutput;
        _live.Dispose();
        _live = null;
        RunBtn.Content = "Run";
        SessionOut.IsReadOnly = true;
    }

    private void OnSessionText(object sender, TextCompositionEventArgs e)
    {
        if (_live is null) return;
        _live.Write(e.Text);
        e.Handled = true;
    }

    private void OnSessionKey(object sender, KeyEventArgs e)
    {
        if (_live is null) return;
        var seq = e.Key switch
        {
            Key.Return => "\r",
            Key.Back => "\b",
            Key.Tab => "\t",
            Key.Escape => "\u001b",
            Key.Up => "\u001b[A",
            Key.Down => "\u001b[B",
            Key.Right => "\u001b[C",
            Key.Left => "\u001b[D",
            Key.C when Keyboard.Modifiers == ModifierKeys.Control => "\u0003",
            Key.D when Keyboard.Modifiers == ModifierKeys.Control => "\u0004",
            _ => null,
        };
        if (seq is null) return;
        _live.Write(seq);
        e.Handled = true;
    }

    private async Task SendInside()
    {
        var text = PromptBox.Text.Trim();
        if (string.IsNullOrEmpty(text))
        {
            AppendSession("\n\nType a question in the bar below, then Send Inside.");
            return;
        }

        if (SendBtn is not null) SendBtn.IsEnabled = false;
        AiChip.Text = "  AI: working…";
        try
        {
            var persona = AgentPick.SelectedItem as AgentPersona ?? AgentRoster.Operator;
            var auto = AutoRunBox?.IsChecked == true;
            if (IsByo())
            {
                await SendByo(text, persona);
                PromptBox.Clear();
                return;
            }

            AppendSession("\n\n[Inside] Working…");
            _insideUp = await _inside.EnsureAsync();
            if (!_insideUp)
            {
                AiChip.Text = SetupCopy.InsideOff;
                AppendSession("\n" + SetupCopy.InsideDown);
                return;
            }

            AiChip.Text = SetupCopy.InsideOn;
            var session = AttachSession.IsChecked == true ? SessionOut.Text : null;
            var reply = await _inside.CompleteAsync(text, session, AgentGuard.SystemPrompt(persona));
            var decision = AgentGuard.Review(persona, AgentTurn.Parse(reply), _scope, _team, autoRunInScope: auto);
            AppendSession($"\n[{persona.Name}]\n{decision.Say}");
            if (decision.ApplyForm && decision.Tool is not null)
            {
                ApplyAgentForm(decision.Tool, decision.Values);
                if (decision.AutoRun)
                {
                    AppendSession("\nRunning proposal (same path as Run)…");
                    var job = await Job.RunAsync(decision.Tool, decision.Values, _scope);
                    if (job.Live is not null)
                    {
                        AttachLive(job);
                    }
                    else
                    {
                        AppendSession("\n" + job.Output);
                        if (job.Ok)
                        {
                            var hint = decision.Values.GetValueOrDefault("target") ?? decision.Values.GetValueOrDefault("url") ?? "";
                            var row = _findings.Add($"{decision.Tool.Name} {hint}".Trim(), job.Output);
                            FindingsList.ItemsSource = null;
                            FindingsList.ItemsSource = _findings.All;
                            FindingsList.SelectedItem = row;
                        }
                    }
                }
                else
                {
                    AppendSession("\n\nFilled the form. Click Run if this looks right.");
                }
            }
            else if (!string.IsNullOrWhiteSpace(decision.Reason) && decision.Reason is not "chat" and not "ok")
            {
                AppendSession("\n" + decision.Reason);
            }
            PromptBox.Clear();
        }
        catch (Exception ex)
        {
            AppendSession("\n" + ex.Message);
            AiChip.Text = SetupCopy.InsideOff;
        }
        finally
        {
            if (SendBtn is not null) SendBtn.IsEnabled = true;
        }
    }

    private bool IsByo() =>
        ModelPick?.SelectedItem is ComboBoxItem item
        && string.Equals(item.Content as string, "BYO", StringComparison.OrdinalIgnoreCase);

    private void OnModelPick(object sender, SelectionChangedEventArgs e)
    {
        var byo = IsByo();
        if (ByoEndpoint is not null) ByoEndpoint.Visibility = byo ? Visibility.Visible : Visibility.Collapsed;
        if (ByoKey is not null) ByoKey.Visibility = byo ? Visibility.Visible : Visibility.Collapsed;
        if (SendBtn is not null) SendBtn.Content = byo ? "Preview & send" : "Send Inside";
        if (PromptHint is not null && string.IsNullOrWhiteSpace(PromptBox?.Text))
            PromptHint.Text = byo ? "BYO — review redacted preview before it leaves" : "Ask Inside — stays on this PC";
    }

    private async Task SendByo(string text, AgentPersona persona)
    {
        var payload = AttachSession.IsChecked == true ? text + "\n\n" + SessionOut.Text : text;
        var preview = PromptRedactor.Preview(payload);
        var body = VendorCopy.Leaves + "\n\n" + VendorCopy.Preview + "\n\n" + preview.Redacted;
        var confirm = MessageBox.Show(body, "BYO send preview", MessageBoxButton.OKCancel, MessageBoxImage.Warning);
        if (confirm != MessageBoxResult.OK)
        {
            AppendSession("\n\n[BYO] Send cancelled. Nothing left this PC.");
            return;
        }

        var endpoint = ByoEndpoint?.Text?.Trim();
        var key = ByoKey?.Password ?? "";
        var provider = (endpoint ?? "").Contains("anthropic", StringComparison.OrdinalIgnoreCase)
            ? LlmProvider.Anthropic
            : LlmProvider.Custom;
        var model = LanguageModel.Byo(provider, key, string.IsNullOrWhiteSpace(endpoint) ? null : endpoint);
        var reply = await ByoClient.CompleteAsync(model, preview, AgentGuard.SystemPrompt(persona));
        AppendSession("\n\n[BYO]\n" + reply);
        AiChip.Text = "  AI: BYO · left this PC";
    }

    private async void OnDraftReport(object sender, RoutedEventArgs e)
    {
        var prompt = EngagementReport.DraftPrompt(_findings.All);
        AppendSession("\n\n[Reporter] Drafting from saved findings…");
        try
        {
            if (IsByo())
            {
                await SendByo(prompt, AgentRoster.Reporter);
                return;
            }
            _insideUp = await _inside.EnsureAsync();
            if (!_insideUp)
            {
                AppendSession("\n" + SetupCopy.InsideDown + "\n\n" + EngagementReport.Outline(_findings.All));
                return;
            }
            var reply = await _inside.CompleteAsync(prompt, session: null, AgentGuard.SystemPrompt(AgentRoster.Reporter));
            AppendSession("\n" + reply);
        }
        catch (Exception ex)
        {
            AppendSession("\n" + ex.Message + "\n\n" + EngagementReport.Outline(_findings.All));
        }
    }

    private void ApplyAgentForm(ToolSpec spec, IReadOnlyDictionary<string, string> values)
    {
        if (ToolSearch is not null) ToolSearch.Text = "";
        Categories.SelectedItem = spec.Category;
        ToolsList.SelectedItem = spec;
        _tool = spec;
        PresetBox.ItemsSource = spec.PresetNames;
        PresetBox.Visibility = spec.PresetNames.Count > 0 ? Visibility.Visible : Visibility.Collapsed;
        RenderForm(spec, values);
        ToolTitle.Text = spec.Name;
        ToolSummary.Text = spec.Summary;
    }

    private void ApplyTeam()
    {
        var hex = Accent.For(_team).Hex;
        var color = (Color)ColorConverter.ConvertFromString(hex);
        var brush = new SolidColorBrush(color);
        var dim = new SolidColorBrush(Color.FromArgb(0x88, color.R, color.G, color.B));
        CaptionBar.BorderBrush = dim;
        CategoryStrip.BorderBrush = dim;
        FormGlass.BorderBrush = dim;
        ComposerBar.BorderBrush = dim;
        RunBtn.Background = brush;
        RunBtn.Foreground = Brushes.Black;
        Application.Current.Resources["TeamPick"] = new SolidColorBrush(Color.FromArgb(0x55, color.R, color.G, color.B));
        Application.Current.Resources["TeamHover"] = new SolidColorBrush(Color.FromArgb(0x33, color.R, color.G, color.B));
        BlueBtn.Opacity = _team == Team.Blue ? 1 : 0.45;
        RedBtn.Opacity = _team == Team.Red ? 1 : 0.45;
        var red = (Color)ColorConverter.ConvertFromString(Accent.For(Team.Red).Hex);
        RedBtn.Foreground = new SolidColorBrush(red);
        RedBtn.BorderBrush = new SolidColorBrush(red);
        Title = _team == Team.Red ? "Seraphim — Red" : "Seraphim — Blue";
        CatalogChip.Text = _team == Team.Red
            ? $"  Red · {Catalog.ToolsFor(_team).Count} tools"
            : $"  Blue · {Catalog.ToolsFor(_team).Count} tools";
        if (WorkLabel is not null)
            WorkLabel.Text = _team == Team.Red ? "RED WORK" : "BLUE WORK";
        var cats = Catalog.CategoriesFor(_team);
        Categories.ItemsSource = cats;
        var home = Catalog.HomeCategory(_team);
        var idx = cats.ToList().IndexOf(home);
        Categories.SelectedIndex = idx >= 0 ? idx : 0;
        ApplyToolFilter();
        FadeHud();
    }

    private void FadeHud()
    {
        var duration = TimeSpan.FromMilliseconds(700);
        HudBlue.BeginAnimation(OpacityProperty, new DoubleAnimation
        {
            To = _team == Team.Blue ? 0.55 : 0,
            Duration = duration,
        });
        HudRed.BeginAnimation(OpacityProperty, new DoubleAnimation
        {
            To = _team == Team.Red ? 0.62 : 0,
            Duration = duration,
        });
        HudRedWash.BeginAnimation(OpacityProperty, new DoubleAnimation
        {
            To = _team == Team.Red ? 1 : 0,
            Duration = duration,
        });
    }
}
