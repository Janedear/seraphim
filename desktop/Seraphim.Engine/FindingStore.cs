using Microsoft.Data.Sqlite;

namespace Seraphim.Engine;

public sealed record Finding(string Id, string Title, string Evidence, DateTimeOffset Created);

public sealed class FindingStore
{
    private readonly string _path;
    private readonly List<Finding> _items = [];

    private FindingStore(string path)
    {
        _path = path;
        var dir = Path.GetDirectoryName(path);
        if (!string.IsNullOrEmpty(dir))
            Directory.CreateDirectory(dir);
        Init();
        Load();
    }

    public static FindingStore Open(string path) => new(path);

    public static FindingStore OpenDefault() =>
        Open(Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Seraphim", "findings.sqlite"));

    public IReadOnlyList<Finding> All => _items;

    public Finding Add(string title, string evidence)
    {
        var row = new Finding(Guid.NewGuid().ToString("n")[..8], title, evidence, DateTimeOffset.UtcNow);
        _items.Insert(0, row);
        using var db = Connect();
        using var cmd = db.CreateCommand();
        cmd.CommandText = "INSERT INTO findings(id, title, evidence, created) VALUES ($id, $title, $evidence, $created)";
        cmd.Parameters.AddWithValue("$id", row.Id);
        cmd.Parameters.AddWithValue("$title", row.Title);
        cmd.Parameters.AddWithValue("$evidence", row.Evidence);
        cmd.Parameters.AddWithValue("$created", row.Created.ToString("o"));
        cmd.ExecuteNonQuery();
        return row;
    }

    private void Init()
    {
        using var db = Connect();
        using var cmd = db.CreateCommand();
        cmd.CommandText =
            "CREATE TABLE IF NOT EXISTS findings (id TEXT PRIMARY KEY, title TEXT NOT NULL, evidence TEXT NOT NULL, created TEXT NOT NULL)";
        cmd.ExecuteNonQuery();
    }

    private void Load()
    {
        _items.Clear();
        using var db = Connect();
        using var cmd = db.CreateCommand();
        cmd.CommandText = "SELECT id, title, evidence, created FROM findings ORDER BY created DESC";
        using var r = cmd.ExecuteReader();
        while (r.Read())
        {
            DateTimeOffset.TryParse(r.GetString(3), out var created);
            _items.Add(new Finding(r.GetString(0), r.GetString(1), r.GetString(2), created));
        }
    }

    private SqliteConnection Connect()
    {
        var db = new SqliteConnection($"Data Source={_path}");
        db.Open();
        return db;
    }
}
