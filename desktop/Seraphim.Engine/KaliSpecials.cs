namespace Seraphim.Engine;

internal static class KaliSpecials
{
    internal static void Add(List<ToolSpec> tools)
    {
        tools.Add(new ToolSpec(
            "nikto", "Nikto", "Vulnerability Analysis", "nikto",
            "Web server scanner for dangerous files, outdated software, and misconfig.",
            [
                new("host", "Host", FieldKind.Text, "-h", Required: true, Placeholder: "10.0.0.1"),
                Fields.Ports(),
                Fields.Flag("ssl", "SSL / TLS", "-ssl"),
                Fields.Select("tuning", "Tuning", "-Tuning", "1", "2", "3", "4", "5", "x", "a", "b"),
                Fields.Text("output", "Output file", "-output", "nikto.txt"),
                Fields.Select("format", "Output format", "-Format", "txt", "csv", "htm", "xml"),
                Fields.Text("evasion", "Evasion", "-evasion", "1"),
                Fields.Flag("no404", "Skip 404 guessing", "-no404"),
                Fields.Text("timeout", "Timeout (s)", "-timeout", "10"),
            ],
            [
                new("Quick", new Dictionary<string, string> { ["tuning"] = "1" }),
                new("SSL", new Dictionary<string, string> { ["ssl"] = "true", ["ports"] = "443" }),
                new("Full", new Dictionary<string, string> { ["tuning"] = "x" }),
            ]));

        tools.Add(new ToolSpec(
            "nuclei", "Nuclei", "Vulnerability Analysis", "nuclei",
            "Template-based vulnerability scanner (ProjectDiscovery).",
            [
                Fields.Url(),
                Fields.Text("list", "URL list", "-l", "urls.txt"),
                Fields.Text("templates", "Templates", "-t", "cves/"),
                Fields.Text("severity", "Severity", "-severity", "critical,high"),
                Fields.Text("tags", "Tags", "-tags", "rce,lfi"),
                Fields.Threads("-c"),
                Fields.Text("rate", "Rate limit", "-rl", "150"),
                Fields.Flag("silent", "Silent", "-silent"),
                Fields.Flag("auto", "Automatic scan", "-as"),
                Fields.Flag("newTemplates", "New templates only", "-nt"),
                Fields.Text("output", "Output file", "-o", "nuclei.txt"),
            ],
            [
                new("Critical / high", new Dictionary<string, string> { ["severity"] = "critical,high", ["silent"] = "true" }),
                new("CVEs", new Dictionary<string, string> { ["templates"] = "cves/", ["silent"] = "true" }),
                new("Automatic", new Dictionary<string, string> { ["auto"] = "true" }),
            ]));

        tools.Add(new ToolSpec(
            "lynis", "Lynis", "Vulnerability Analysis", "lynis",
            "Host hardening and audit scanner.",
            [
                new("mode", "Audit mode", FieldKind.Select, "", Required: true, Default: "system", Options: ["system", "dockerfile", "remote"]),
                Fields.Target("Remote host", "10.0.0.1", ""),
                Fields.Flag("quick", "Quick", "--quick"),
                Fields.Flag("pentest", "Pentest profile", "--pentest"),
                Fields.Text("auditor", "Auditor name", "--auditor", "seraphim"),
                Fields.Text("logfile", "Log file", "--logfile", "lynis.log"),
                Fields.Flag("cron", "Cron / no pause", "--cronjob"),
                Fields.Flag("noColors", "No colors", "--no-colors"),
            ],
            Prefix: ["audit"],
            Presets:
            [
                new("Quick local", new Dictionary<string, string> { ["mode"] = "system", ["quick"] = "true" }),
                new("Pentest", new Dictionary<string, string> { ["mode"] = "system", ["pentest"] = "true" }),
                new("Cron", new Dictionary<string, string> { ["mode"] = "system", ["cron"] = "true", ["noColors"] = "true" }),
            ]));

        tools.Add(new ToolSpec(
            "masscan", "masscan", "Information Gathering", "masscan",
            "Asynchronous Internet-scale port scanner.",
            [
                Fields.Target("Host or CIDR", "10.0.0.0/24"),
                Fields.Text("ports", "Ports", "-p", "80,443,8080,8443", "80,443"),
                Fields.Text("rate", "Packets/sec", "--rate", "1000", "1000"),
                new("iface", "Interface", FieldKind.Text, "-e", Placeholder: "eth0"),
                Fields.Text("sourceIp", "Source IP", "--source-ip", "10.0.0.2"),
                Fields.Flag("banners", "Grab banners", "--banners"),
                Fields.Flag("ping", "Ping scan", "--ping"),
                Fields.Text("wait", "Wait after send (s)", "--wait", "10"),
                Fields.Text("output", "Output file", "-oL", "masscan.txt"),
            ],
            [
                new("Top web", new Dictionary<string, string> { ["ports"] = "80,443,8080,8443", ["rate"] = "1000" }),
                new("Common", new Dictionary<string, string> { ["ports"] = "22,80,443,445,3389", ["rate"] = "500" }),
                new("Fast banners", new Dictionary<string, string> { ["ports"] = "80,443", ["rate"] = "10000", ["banners"] = "true" }),
            ]));

        tools.Add(new ToolSpec(
            "rustscan", "RustScan", "Information Gathering", "rustscan",
            "Fast port scanner that can hand off open ports to Nmap.",
            [
                new("target", "Addresses", FieldKind.Text, "-a", Required: true, Default: "10.0.0.1", Placeholder: "10.0.0.1"),
                Fields.Ports(),
                Fields.Text("ulimit", "Ulimit", "--ulimit", "5000"),
                Fields.Text("batch", "Batch size", "-b", "4500"),
                Fields.Text("timeout", "Timeout (ms)", "-t", "1500"),
                Fields.Select("scripts", "Scripts", "--scripts", "none", "default"),
                Fields.Flag("top", "Top 1000 ports", "--top"),
                Fields.Flag("greppable", "Greppable", "-g"),
                Fields.Flag("accessible", "Accessible output", "--accessible"),
            ],
            [
                new("Top ports", new Dictionary<string, string> { ["top"] = "true", ["ulimit"] = "5000" }),
                new("Common", new Dictionary<string, string> { ["ports"] = "22,80,443,3389,8080", ["ulimit"] = "5000" }),
                new("Greppable", new Dictionary<string, string> { ["greppable"] = "true", ["accessible"] = "true", ["top"] = "true" }),
            ]));

        tools.Add(new ToolSpec(
            "theharvester", "theHarvester", "Information Gathering", "theHarvester",
            "OSINT emails, names, subdomains, and IPs from public sources.",
            [
                new("domain", "Domain", FieldKind.Text, "-d", Required: true, Placeholder: "example.com"),
                Fields.Select("source", "Source", "-b", "all", "bing", "brave", "duckduckgo", "google", "yahoo", "crtsh", "dnsdumpster", "hackertarget", "urlscan", "virustotal"),
                Fields.Text("limit", "Limit", "-l", "200"),
                Fields.Text("filename", "Output prefix", "-f", "harvest"),
                Fields.Flag("dnsBrute", "DNS brute force", "--dns-brute"),
                Fields.Flag("dnsLookup", "DNS lookup", "--dns-lookup"),
                Fields.Flag("virtualHost", "Virtual hosts", "--virtual-host"),
                Fields.Text("proxies", "Proxy list", "--proxies", "proxies.txt"),
            ],
            [
                new("Passive all", new Dictionary<string, string> { ["source"] = "all", ["limit"] = "200" }),
                new("CT + brute", new Dictionary<string, string> { ["source"] = "crtsh", ["dnsBrute"] = "true" }),
                new("Quick", new Dictionary<string, string> { ["source"] = "bing", ["limit"] = "50" }),
            ]));

        tools.Add(new ToolSpec(
            "dnsrecon", "dnsrecon", "Information Gathering", "dnsrecon",
            "DNS enumeration, zone walk, brute force, and cache snoop.",
            [
                new("domain", "Domain", FieldKind.Text, "-d", Required: true, Placeholder: "example.com"),
                Fields.Select("type", "Type", "-t", "std", "rvl", "brt", "srt", "axfr", "goo", "zonewalk"),
                Fields.Wordlist("-D"),
                Fields.Text("nameserver", "Name server", "-n", "8.8.8.8"),
                Fields.Threads("--threads"),
                Fields.Text("lifetime", "Lifetime (s)", "--lifetime", "10"),
                Fields.Text("xml", "XML output", "-x", "dnsrecon.xml"),
                Fields.Text("json", "JSON output", "-j", "dnsrecon.json"),
            ],
            [
                new("Standard", new Dictionary<string, string> { ["type"] = "std" }),
                new("Zone transfer", new Dictionary<string, string> { ["type"] = "axfr" }),
                new("Brute", new Dictionary<string, string> { ["type"] = "brt", ["wordlist"] = "/usr/share/wordlists/dnsmap.txt" }),
            ]));

        tools.Add(new ToolSpec(
            "amass", "Amass", "Information Gathering", "amass",
            "In-depth DNS and attack-surface mapping.",
            [
                new("domain", "Domain", FieldKind.Text, "-d", Required: true, Placeholder: "example.com"),
                Fields.Flag("passive", "Passive only", "-passive"),
                Fields.Flag("active", "Active", "-active"),
                Fields.Flag("brute", "Brute force", "-brute"),
                Fields.Wordlist(),
                Fields.Flag("ip", "Show IPs", "-ip"),
                Fields.Text("output", "Output file", "-o", "amass.txt"),
                Fields.Text("config", "Config file", "-config", "amass.ini"),
                Fields.Flag("silent", "Silent", "-silent"),
            ],
            Prefix: ["enum"],
            Presets:
            [
                new("Passive", new Dictionary<string, string> { ["passive"] = "true" }),
                new("Brute", new Dictionary<string, string> { ["brute"] = "true" }),
                new("Passive + IP", new Dictionary<string, string> { ["passive"] = "true", ["ip"] = "true" }),
            ]));

        tools.Add(new ToolSpec(
            "enum4linux", "enum4linux", "Information Gathering", "enum4linux",
            "SMB/NetBIOS enumeration (Samba wrapper).",
            [
                Fields.Target(),
                Fields.Flag("all", "All simple enum (-a)", "-a"),
                Fields.Flag("users", "Users (-U)", "-U"),
                Fields.Flag("shares", "Shares (-S)", "-S"),
                Fields.Flag("policy", "Password policy (-P)", "-P"),
                Fields.Flag("osInfo", "OS info (-o)", "-o"),
                Fields.Flag("nmb", "NMB lookup (-n)", "-n"),
                Fields.Flag("rid", "RID cycle (-r)", "-r"),
                Fields.Text("user", "Username", "-u", "guest"),
                Fields.Text("pass", "Password", "-p", "guest"),
            ],
            [
                new("All", new Dictionary<string, string> { ["all"] = "true" }),
                new("Shares + users", new Dictionary<string, string> { ["users"] = "true", ["shares"] = "true" }),
                new("Guest", new Dictionary<string, string> { ["all"] = "true", ["user"] = "guest", ["pass"] = "guest" }),
            ]));

        tools.Add(new ToolSpec(
            "smbmap", "smbmap", "Information Gathering", "smbmap",
            "Enumerate Samba share permissions and contents.",
            [
                new("host", "Host", FieldKind.Text, "-H", Required: true, Default: "10.0.0.1", Placeholder: "10.0.0.1"),
                Fields.Text("user", "Username", "-u", "guest"),
                Fields.Text("pass", "Password", "-p", "guest"),
                Fields.Text("domain", "Domain", "-d", "WORKGROUP"),
                Fields.Text("port", "Port", "-P", "445"),
                Fields.Flag("list", "List shares", "-L"),
                Fields.Flag("recursive", "Recurse shares", "-R"),
                Fields.Flag("admin", "Admin check", "--admin"),
                Fields.Text("pattern", "Download pattern", "-A", ".txt"),
            ],
            [
                new("Guest list", new Dictionary<string, string> { ["user"] = "guest", ["pass"] = "guest", ["list"] = "true" }),
                new("Recurse", new Dictionary<string, string> { ["recursive"] = "true" }),
                new("Admin check", new Dictionary<string, string> { ["admin"] = "true" }),
            ]));

        tools.Add(new ToolSpec(
            "whatweb", "WhatWeb", "Web Application Analysis", "whatweb",
            "Identify CMS, JavaScript libraries, and web plugins.",
            [
                new("url", "URL", FieldKind.Text, "", Required: true, Placeholder: "http://10.0.0.1/", Positional: true),
                Fields.Select("aggression", "Aggression", "-a", "1", "2", "3", "4"),
                Fields.Verbose(),
                Fields.Text("userAgent", "User-Agent", "-U", "Mozilla/5.0"),
                Fields.Text("cookie", "Cookie", "--cookie", "session=1"),
                Fields.Select("color", "Color", "--color", "never", "auto", "always"),
                Fields.Text("logJson", "JSON log", "--log-json", "whatweb.json"),
                Fields.Flag("noErrors", "Hide errors", "--no-errors"),
            ],
            [
                new("Stealth", new Dictionary<string, string> { ["aggression"] = "1" }),
                new("Aggressive", new Dictionary<string, string> { ["aggression"] = "3", ["verbose"] = "true" }),
                new("Identify", new Dictionary<string, string> { ["aggression"] = "4" }),
            ]));

        tools.Add(new ToolSpec(
            "wafw00f", "Wafw00f", "Information Gathering", "wafw00f",
            "Identify web application firewalls.",
            [
                new("url", "URL", FieldKind.Text, "", Required: true, Placeholder: "http://10.0.0.1/", Positional: true),
                Fields.Flag("findall", "Find all WAFs", "-a"),
                Fields.Verbose(),
                Fields.Text("proxy", "Proxy", "-p", "http://127.0.0.1:8080"),
                Fields.Flag("noHead", "Use GET (no HEAD)", "--nohead"),
                Fields.Text("headers", "Header", "-H", "Host: target"),
                Fields.Flag("list", "List known WAFs", "-l"),
            ],
            [
                new("Identify", new Dictionary<string, string>()),
                new("Find all", new Dictionary<string, string> { ["findall"] = "true", ["verbose"] = "true" }),
                new("List WAFs", new Dictionary<string, string> { ["list"] = "true" }),
            ]));

        tools.Add(new ToolSpec(
            "ffuf", "ffuf", "Web Application Analysis", "ffuf",
            "Fast web fuzzer (Go).",
            [
                new("url", "URL (include FUZZ)", FieldKind.Text, "-u", Required: true, Placeholder: "http://10.0.0.1/FUZZ"),
                Fields.Wordlist(),
                Fields.Threads(),
                Fields.Text("matchCodes", "Match codes", "-mc", "200,204,301,302,307,401,403"),
                Fields.Text("filterCodes", "Filter codes", "-fc", "404"),
                Fields.Text("extensions", "Extensions", "-e", ".php,.html,.txt"),
                Fields.Flag("recursion", "Recurse", "-recursion"),
                Fields.Text("recursionDepth", "Recursion depth", "-recursion-depth", "2"),
                Fields.Text("method", "Method", "-X", "GET"),
                Fields.Text("data", "POST data", "-d", "user=FUZZ"),
                Fields.Flag("follow", "Follow redirects", "-r"),
                Fields.Flag("color", "Color", "-c"),
            ],
            [
                new("Dirs", new Dictionary<string, string> { ["url"] = "http://10.0.0.1/FUZZ", ["matchCodes"] = "200,204,301,302,307,401,403" }),
                new("Extensions", new Dictionary<string, string> { ["url"] = "http://10.0.0.1/FUZZ", ["extensions"] = ".php,.html,.txt", ["matchCodes"] = "200,301" }),
                new("Recurse", new Dictionary<string, string> { ["url"] = "http://10.0.0.1/FUZZ", ["recursion"] = "true", ["recursionDepth"] = "2" }),
            ]));

        tools.Add(new ToolSpec(
            "feroxbuster", "feroxbuster", "Web Application Analysis", "feroxbuster",
            "Recursive content discovery.",
            [
                Fields.Url(),
                Fields.Wordlist(),
                Fields.Threads(),
                Fields.Text("extensions", "Extensions", "-x", "php,html,txt"),
                Fields.Text("depth", "Depth", "-d", "4"),
                Fields.Text("status", "Status codes", "-s", "200,204,301,302,307,401,403"),
                Fields.Flag("extractLinks", "Extract links", "-e"),
                Fields.Flag("collectBackups", "Collect backups", "--collect-backups"),
                Fields.Flag("collectWords", "Collect words", "--collect-words"),
                Fields.Flag("noRecursion", "No recursion", "--no-recursion"),
                Fields.Flag("insecure", "Skip TLS verify", "-k"),
                Fields.Flag("silent", "Silent", "--silent"),
            ],
            [
                new("Quiet recurse", new Dictionary<string, string> { ["silent"] = "true", ["depth"] = "4", ["extensions"] = "php,html,txt" }),
                new("Backups", new Dictionary<string, string> { ["collectBackups"] = "true", ["extractLinks"] = "true" }),
                new("Shallow", new Dictionary<string, string> { ["noRecursion"] = "true", ["extensions"] = "php,html" }),
            ]));

        tools.Add(new ToolSpec(
            "wpscan", "WPScan", "Web Application Analysis", "wpscan",
            "WordPress vulnerability scanner.",
            [
                Fields.Url("url", "--url"),
                Fields.Text("enumerate", "Enumerate", "-e", "vp,vt,u"),
                Fields.Select("plugins", "Plugin detection", "--plugins-detection", "mixed", "passive", "aggressive"),
                Fields.Text("apiToken", "API token", "--api-token"),
                Fields.Text("users", "User list", "-U", "users.txt"),
                Fields.Wordlist("-P"),
                Fields.Threads(),
                Fields.Flag("randomUa", "Random User-Agent", "--random-user-agent"),
                Fields.Flag("stealthy", "Stealthy", "--stealthy"),
                Fields.Flag("noTls", "Disable TLS checks", "--disable-tls-checks"),
            ],
            [
                new("Enumerate", new Dictionary<string, string> { ["enumerate"] = "vp,vt,u", ["randomUa"] = "true" }),
                new("Stealth", new Dictionary<string, string> { ["stealthy"] = "true", ["plugins"] = "passive" }),
                new("Aggressive plugins", new Dictionary<string, string> { ["plugins"] = "aggressive", ["enumerate"] = "vp,ap" }),
            ]));

        tools.Add(new ToolSpec(
            "dirb", "dirb", "Web Application Analysis", "dirb",
            "Web content scanner with wordlists.",
            [
                new("url", "URL", FieldKind.Text, "", Required: true, Placeholder: "http://10.0.0.1/"),
                new("wordlist", "Wordlist", FieldKind.Text, "", Placeholder: "/usr/share/dirb/wordlists/common.txt"),
                Fields.Text("extensions", "Extensions", "-x", ".php,.html,.txt"),
                Fields.Flag("noRecurse", "No recurse", "-r"),
                Fields.Flag("silent", "Silent", "-S"),
                Fields.Text("delay", "Delay (ms)", "-z", "10"),
                Fields.Text("cookie", "Cookie", "-c", "session=1"),
                Fields.Text("userAgent", "User-Agent", "-a", "Mozilla/5.0"),
                Fields.Text("proxy", "Proxy", "-p", "127.0.0.1:8080"),
                Fields.Flag("insecure", "Ignore TLS errors", "-k"),
            ],
            [
                new("Common", new Dictionary<string, string> { ["wordlist"] = "/usr/share/dirb/wordlists/common.txt" }),
                new("Big", new Dictionary<string, string> { ["wordlist"] = "/usr/share/dirb/wordlists/big.txt" }),
                new("No recurse", new Dictionary<string, string> { ["noRecurse"] = "true", ["extensions"] = ".php,.html,.txt" }),
            ]));

        tools.Add(new ToolSpec(
            "wfuzz", "Wfuzz", "Vulnerability Analysis", "wfuzz",
            "Web application fuzzer.",
            [
                new("url", "URL (include FUZZ)", FieldKind.Text, "-u", Required: true, Placeholder: "http://10.0.0.1/FUZZ"),
                Fields.Wordlist(),
                Fields.Threads(),
                Fields.Text("hideCode", "Hide codes", "--hc", "404"),
                Fields.Text("showCode", "Show codes", "--sc", "200,301"),
                Fields.Text("method", "Method", "-X", "GET"),
                Fields.Text("data", "POST data", "-d", "user=FUZZ&pass=x"),
                Fields.Flag("follow", "Follow redirects", "-L"),
                Fields.Flag("color", "Color", "-c"),
                Fields.Text("filter", "Filter", "--filter", "c=200"),
            ],
            [
                new("Dirs hide 404", new Dictionary<string, string> { ["url"] = "http://10.0.0.1/FUZZ", ["hideCode"] = "404" }),
                new("Params", new Dictionary<string, string> { ["url"] = "http://10.0.0.1/index.php?FUZZ=1", ["hideCode"] = "404" }),
                new("POST", new Dictionary<string, string> { ["method"] = "POST", ["data"] = "user=FUZZ&pass=x", ["hideCode"] = "404" }),
            ]));

        tools.Add(new ToolSpec(
            "commix", "Commix", "Web Application Analysis", "commix",
            "Command-injection detection and exploitation.",
            [
                Fields.Url("url", "--url"),
                Fields.Text("data", "POST data", "--data", "id=1"),
                Fields.Text("cookie", "Cookie", "--cookie", "session=1"),
                Fields.Select("level", "Level", "--level", "1", "2", "3"),
                Fields.Text("osCmd", "OS command", "--os-cmd", "id"),
                Fields.Text("technique", "Technique", "--technique", "c"),
                Fields.Flag("batch", "Batch (no questions)", "--batch"),
                Fields.Flag("all", "All parameters", "--all"),
                Fields.Flag("flush", "Flush session", "--flush-session"),
            ],
            [
                new("Batch detect", new Dictionary<string, string> { ["batch"] = "true" }),
                new("OS command", new Dictionary<string, string> { ["batch"] = "true", ["osCmd"] = "id" }),
                new("All params", new Dictionary<string, string> { ["all"] = "true", ["batch"] = "true" }),
            ]));

        tools.Add(new ToolSpec(
            "john", "John the Ripper", "Password Attacks", "john",
            "Offline password cracker.",
            [
                Fields.InputFile("Hash file"),
                Fields.Wordlist("--wordlist"),
                Fields.Select("format", "Format", "--format", "raw-md5", "raw-sha1", "raw-sha256", "NT", "lm", "bcrypt", "descrypt", "sha512crypt", "netntlmv2", "krb5tgs", "wpapsk", "zip", "rar"),
                Fields.Flag("rules", "Wordlist rules", "--rules"),
                Fields.Flag("incremental", "Incremental", "--incremental"),
                Fields.Flag("show", "Show cracked", "--show"),
                Fields.Text("session", "Session name", "--session", "john"),
                Fields.Text("fork", "Fork processes", "--fork", "4"),
                Fields.Text("pot", "Pot file", "--pot", "john.pot"),
            ],
            [
                new("Wordlist + rules", new Dictionary<string, string> { ["rules"] = "true" }),
                new("Show cracked", new Dictionary<string, string> { ["show"] = "true" }),
                new("Incremental", new Dictionary<string, string> { ["incremental"] = "true" }),
            ]));

        tools.Add(new ToolSpec(
            "hashcat", "hashcat", "Password Attacks", "hashcat",
            "GPU password recovery.",
            [
                Fields.Text("mode", "Hash mode (-m)", "-m", "0", "0"),
                Fields.Select("attack", "Attack mode (-a)", "-a", "0", "1", "3", "6", "7"),
                Fields.InputFile("Hash file"),
                new("wordlist", "Wordlist / mask", FieldKind.Text, "", Placeholder: "/usr/share/wordlists/rockyou.txt", Positional: true),
                Fields.Select("workload", "Workload (-w)", "-w", "1", "2", "3", "4"),
                Fields.Text("outfile", "Output file", "-o", "cracked.txt"),
                Fields.Flag("optimized", "Optimized kernels", "-O"),
                Fields.Flag("force", "Force", "--force"),
                Fields.Flag("show", "Show cracked", "--show"),
                Fields.Flag("username", "Hash file has usernames", "--username"),
                Fields.Flag("increment", "Increment mask", "--increment"),
            ],
            [
                new("MD5 wordlist", new Dictionary<string, string> { ["mode"] = "0", ["attack"] = "0" }),
                new("NTLM", new Dictionary<string, string> { ["mode"] = "1000", ["attack"] = "0" }),
                new("WPA", new Dictionary<string, string> { ["mode"] = "22000", ["attack"] = "0" }),
            ]));

        tools.Add(new ToolSpec(
            "medusa", "Medusa", "Password Attacks", "medusa",
            "Parallel network login brute force.",
            [
                new("host", "Host", FieldKind.Text, "-h", Required: true, Default: "10.0.0.1", Placeholder: "10.0.0.1"),
                Fields.Text("user", "Username", "-u", "admin"),
                Fields.Text("userFile", "Username file", "-U", "users.txt"),
                Fields.Wordlist("-P"),
                Fields.Select("module", "Module", "-M", "ssh", "ftp", "http", "https", "smbnt", "rdp", "mysql", "mssql", "smtp", "vnc", "telnet", "pop3"),
                Fields.Text("port", "Port", "-n", "22"),
                Fields.Threads(),
                Fields.Text("verbose", "Verbosity (0-6)", "-v", "4"),
                Fields.Flag("ssl", "SSL", "-s"),
                Fields.Flag("stopSuccess", "Stop on success", "-f"),
            ],
            [
                new("SSH", new Dictionary<string, string> { ["module"] = "ssh", ["port"] = "22" }),
                new("SMB", new Dictionary<string, string> { ["module"] = "smbnt", ["port"] = "445" }),
                new("HTTP", new Dictionary<string, string> { ["module"] = "http", ["port"] = "80" }),
            ]));

        tools.Add(new ToolSpec(
            "crunch", "crunch", "Password Attacks", "crunch",
            "Generate custom wordlists from a charset and length.",
            [
                new("min", "Min length", FieldKind.Text, "", Required: true, Default: "8", Placeholder: "8"),
                new("max", "Max length", FieldKind.Text, "", Required: true, Default: "8", Placeholder: "8"),
                new("charset", "Charset", FieldKind.Text, "", Placeholder: "abcdefghijklmnopqrstuvwxyz"),
                Fields.Text("output", "Output file", "-o", "wordlist.txt"),
                Fields.Text("pattern", "Pattern (-t)", "-t", "@@@@%%%%"),
                Fields.Text("start", "Start at", "-s", "aaaa"),
                Fields.Text("count", "Count", "-c", "100000"),
                Fields.Text("charsetFile", "Charset file", "-f", "/usr/share/crunch/charset.lst"),
            ],
            [
                new("PIN 4", new Dictionary<string, string> { ["min"] = "4", ["max"] = "4", ["charset"] = "0123456789" }),
                new("Lower 6-8", new Dictionary<string, string> { ["min"] = "6", ["max"] = "8", ["charset"] = "abcdefghijklmnopqrstuvwxyz" }),
                new("Hex 8", new Dictionary<string, string> { ["min"] = "8", ["max"] = "8", ["charset"] = "0123456789abcdef" }),
            ]));

        tools.Add(new ToolSpec(
            "cewl", "CeWL", "Password Attacks", "cewl",
            "Spider a site to build a custom wordlist.",
            [
                new("url", "URL", FieldKind.Text, "", Required: true, Placeholder: "http://10.0.0.1/", Positional: true),
                Fields.Text("depth", "Depth", "-d", "2"),
                Fields.Text("minWord", "Min word length", "-m", "5"),
                Fields.Text("write", "Write wordlist", "-w", "cewl.txt"),
                Fields.Flag("email", "Harvest emails", "-e"),
                Fields.Flag("withNumbers", "Keep numbers", "--with-numbers"),
                Fields.Flag("lowercase", "Lowercase", "--lowercase"),
                Fields.Flag("meta", "Metadata words", "--meta"),
                Fields.Text("userAgent", "User-Agent", "-a", "Mozilla/5.0"),
                Fields.Text("authUser", "Auth user", "-u", "admin"),
                Fields.Text("authPass", "Auth password", "-p"),
            ],
            [
                new("Default spider", new Dictionary<string, string> { ["depth"] = "2", ["minWord"] = "5" }),
                new("Emails", new Dictionary<string, string> { ["email"] = "true", ["depth"] = "2" }),
                new("Numbers", new Dictionary<string, string> { ["withNumbers"] = "true", ["lowercase"] = "true", ["minWord"] = "4" }),
            ]));

        tools.Add(new ToolSpec(
            "aircrack-ng", "Aircrack-ng", "Wireless Attacks", "aircrack-ng",
            "WEP/WPA crack against a capture file.",
            [
                Fields.InputFile("Capture file"),
                Fields.Wordlist(),
                Fields.Text("bssid", "BSSID", "-b", "00:11:22:33:44:55"),
                Fields.Text("essid", "ESSID", "-e", "Example"),
                Fields.Select("mode", "Mode", "-a", "1", "2"),
                Fields.Text("cpu", "CPU threads", "-p", "4"),
                Fields.Text("keyFile", "Write key to", "-l", "key.txt"),
                Fields.Flag("quiet", "Quiet", "-q"),
            ],
            [
                new("WPA dict", new Dictionary<string, string> { ["mode"] = "2" }),
                new("WEP", new Dictionary<string, string> { ["mode"] = "1" }),
                new("Quiet WPA", new Dictionary<string, string> { ["mode"] = "2", ["quiet"] = "true" }),
            ]));

        tools.Add(new ToolSpec(
            "wifite", "Wifite", "Wireless Attacks", "wifite",
            "Automated wireless auditor.",
            [
                Fields.Iface(),
                Fields.Flag("wpa", "WPA/WPA2 only", "--wpa"),
                Fields.Flag("wep", "WEP only", "--wep"),
                Fields.Flag("wps", "WPS only", "--wps"),
                Fields.Flag("kill", "Kill conflicting processes", "--kill"),
                Fields.Wordlist("--dict"),
                Fields.Text("bssid", "BSSID", "-b", "00:11:22:33:44:55"),
                Fields.Text("channel", "Channel", "-c", "6"),
                Fields.Flag("clientsOnly", "Clients only", "--clients-only"),
                Fields.Text("wait", "Wait between attacks (s)", "--wait", "5"),
            ],
            [
                new("WPA + WPS", new Dictionary<string, string> { ["wpa"] = "true", ["wps"] = "true", ["kill"] = "true" }),
                new("WPA only", new Dictionary<string, string> { ["wpa"] = "true", ["kill"] = "true" }),
                new("WPS", new Dictionary<string, string> { ["wps"] = "true", ["kill"] = "true" }),
            ]));

        tools.Add(new ToolSpec(
            "reaver", "Reaver", "Wireless Attacks", "reaver",
            "WPS PIN brute force.",
            [
                Fields.Iface(),
                Fields.Text("bssid", "BSSID", "-b", "00:11:22:33:44:55"),
                Fields.Text("channel", "Channel", "-c", "6"),
                Fields.Text("pixie", "Pixie dust (-K)", "-K", "1"),
                Fields.Text("pin", "PIN", "-p", "12345670"),
                Fields.Text("delay", "Delay (s)", "-d", "1"),
                Fields.Text("timeout", "Timeout (s)", "-T", "5"),
                Fields.Flag("verbose", "Very verbose", "-vv"),
                Fields.Flag("auto", "Auto detect settings", "-a"),
                Fields.Flag("noNacks", "Ignore NACKs", "-N"),
            ],
            [
                new("Pixie", new Dictionary<string, string> { ["pixie"] = "1", ["verbose"] = "true" }),
                new("Full PIN", new Dictionary<string, string> { ["verbose"] = "true" }),
                new("Channel 6 pixie", new Dictionary<string, string> { ["channel"] = "6", ["pixie"] = "1" }),
            ]));

        tools.Add(new ToolSpec(
            "kismet", "Kismet", "Wireless Attacks", "kismet",
            "Wireless sniffer, wardrive, and IDS.",
            [
                new("source", "Source / interface", FieldKind.Text, "-c", Placeholder: "wlan0"),
                Fields.Flag("noNcurses", "No ncurses UI", "--no-ncurses"),
                Fields.Text("logPrefix", "Log prefix", "--log-prefix", "kismet"),
                Fields.Flag("noLogging", "No logging", "--no-logging"),
                Fields.Text("listen", "Listen address", "--listen", "127.0.0.1:2501"),
                Fields.Flag("silent", "Silent", "--silent"),
            ],
            [
                new("wlan0", new Dictionary<string, string> { ["source"] = "wlan0" }),
                new("Headless", new Dictionary<string, string> { ["source"] = "wlan0", ["noNcurses"] = "true" }),
                new("No logs", new Dictionary<string, string> { ["source"] = "wlan0", ["noNcurses"] = "true", ["noLogging"] = "true" }),
            ]));

        tools.Add(new ToolSpec(
            "searchsploit", "searchsploit", "Exploitation Tools", "searchsploit",
            "Query Exploit-DB offline.",
            [
                new("query", "Search terms", FieldKind.Text, "", Required: true, Placeholder: "apache 2.4", Positional: true),
                Fields.Flag("title", "Title only", "-t"),
                Fields.Flag("www", "Open EDB links", "--www"),
                Fields.Flag("exact", "Exact match", "--exact"),
                Fields.Flag("json", "JSON", "--json"),
                Fields.Text("exclude", "Exclude path", "--exclude", "/dos/"),
                Fields.Text("cve", "CVE", "--cve", "2021-41773"),
                Fields.Text("edbId", "EDB-ID path", "-p", "12345"),
            ],
            [
                new("Web links", new Dictionary<string, string> { ["www"] = "true" }),
                new("Titles only", new Dictionary<string, string> { ["title"] = "true" }),
                new("Exclude DoS", new Dictionary<string, string> { ["exclude"] = "/dos/" }),
            ]));

        tools.Add(new ToolSpec(
            "msfconsole", "Metasploit", "Exploitation Tools", "msfconsole",
            "Metasploit Framework console.",
            [
                Fields.Flag("quiet", "Quiet banner", "-q"),
                Fields.Text("resource", "Resource script", "-r", "script.rc"),
                Fields.Select("exec", "Run then exit", "-x", "version", "help", "banner"),
                Fields.Flag("defer", "Defer module loads", "--defer-module-loads"),
                Fields.Flag("version", "Print version", "--version"),
            ],
            [
                new("Quiet", new Dictionary<string, string> { ["quiet"] = "true" }),
                new("Quiet version", new Dictionary<string, string> { ["quiet"] = "true", ["exec"] = "version" }),
                new("Resource", new Dictionary<string, string> { ["quiet"] = "true", ["resource"] = "script.rc" }),
            ]));

        tools.Add(new ToolSpec(
            "bettercap", "bettercap", "Sniffing & Spoofing", "bettercap",
            "MITM framework for net, Wi-Fi, and BLE.",
            [
                Fields.Iface(),
                Fields.Text("caplet", "Caplet", "-caplet", "http-req-dump"),
                Fields.Select("eval", "Eval", "-eval", "net.probe on; net.recon on", "net.sniff on", "wifi.recon on"),
                Fields.Flag("noColors", "No colors", "-no-colors"),
                Fields.Flag("noHistory", "No history", "-no-history"),
                Fields.Text("gateway", "Gateway override", "-gateway-override", "10.0.0.1"),
            ],
            [
                new("Probe + recon", new Dictionary<string, string> { ["eval"] = "net.probe on; net.recon on" }),
                new("HTTP dump", new Dictionary<string, string> { ["caplet"] = "http-req-dump" }),
                new("Wi-Fi recon", new Dictionary<string, string> { ["eval"] = "wifi.recon on" }),
            ]));

        tools.Add(new ToolSpec(
            "responder", "Responder", "Sniffing & Spoofing", "responder",
            "LLMNR/NBT-NS/mDNS poisoner.",
            [
                new("iface", "Interface", FieldKind.Text, "-I", Required: true, Default: "eth0", Placeholder: "eth0"),
                Fields.Flag("analyze", "Analyze only", "-A"),
                Fields.Flag("wpad", "WPAD rogue", "-w"),
                Fields.Flag("dhcp", "DHCP", "-d"),
                Fields.Flag("fingerprint", "Fingerprint", "-f"),
                Fields.Flag("forceWpad", "Force WPAD auth", "-F"),
                Fields.Flag("basic", "Force Basic auth", "-b"),
                Fields.Verbose(),
                Fields.Text("externalIp", "External IP", "-e", "10.0.0.2"),
            ],
            [
                new("Analyze", new Dictionary<string, string> { ["analyze"] = "true" }),
                new("WPAD + DHCP", new Dictionary<string, string> { ["wpad"] = "true", ["dhcp"] = "true", ["fingerprint"] = "true" }),
                new("Poison", new Dictionary<string, string> { ["wpad"] = "true", ["verbose"] = "true" }),
            ]));

        tools.Add(new ToolSpec(
            "tcpdump", "tcpdump", "Sniffing & Spoofing", "tcpdump",
            "Classic packet capture.",
            [
                Fields.Iface(),
                Fields.Text("count", "Packet count", "-c", "100"),
                Fields.Text("write", "Write pcap", "-w", "capture.pcap"),
                Fields.Text("snaplen", "Snaplen", "-s", "0"),
                Fields.Flag("noDns", "No name resolution", "-nn"),
                Fields.Verbose(),
                Fields.Flag("monitor", "Monitor mode", "-I"),
                new("filter", "BPF filter", FieldKind.Text, "", Placeholder: "tcp port 80", Positional: true),
            ],
            [
                new("HTTP", new Dictionary<string, string> { ["filter"] = "tcp port 80 or tcp port 443", ["noDns"] = "true" }),
                new("DNS", new Dictionary<string, string> { ["filter"] = "port 53", ["noDns"] = "true" }),
                new("Write 100", new Dictionary<string, string> { ["count"] = "100", ["write"] = "capture.pcap", ["noDns"] = "true" }),
            ]));

        tools.Add(new ToolSpec(
            "tshark", "tshark", "Sniffing & Spoofing", "tshark",
            "Wireshark CLI packet capture and decode.",
            [
                Fields.Iface(),
                Fields.Text("count", "Packet count", "-c", "100"),
                Fields.Text("write", "Write pcap", "-w", "capture.pcap"),
                Fields.Text("read", "Read pcap", "-r", "capture.pcap"),
                Fields.Text("displayFilter", "Display filter", "-Y", "http"),
                Fields.Select("output", "Output format", "-T", "text", "fields", "json", "ek", "pdml", "psml"),
                Fields.Text("field", "Field (-e)", "-e", "ip.src"),
                Fields.Flag("noNameRes", "No name resolution", "-n"),
                Fields.Flag("listIfaces", "List interfaces", "-D"),
            ],
            [
                new("HTTP", new Dictionary<string, string> { ["displayFilter"] = "http", ["noNameRes"] = "true" }),
                new("DNS", new Dictionary<string, string> { ["displayFilter"] = "dns" }),
                new("From pcap", new Dictionary<string, string> { ["read"] = "capture.pcap", ["displayFilter"] = "http" }),
            ]));

        tools.Add(new ToolSpec(
            "wireshark", "Wireshark", "Sniffing & Spoofing", "wireshark",
            "GUI packet analyzer.",
            [
                Fields.Iface(),
                Fields.Flag("start", "Start capturing", "-k"),
                Fields.Text("displayFilter", "Display filter", "-Y", "http"),
                Fields.Text("captureFilter", "Capture filter", "-f", "tcp port 80"),
                Fields.Text("read", "Open pcap", "-r", "capture.pcap"),
                Fields.Flag("noNameRes", "No name resolution", "-n"),
                Fields.Flag("listIfaces", "List interfaces", "-D"),
            ],
            [
                new("Capture now", new Dictionary<string, string> { ["start"] = "true" }),
                new("HTTP", new Dictionary<string, string> { ["start"] = "true", ["displayFilter"] = "http" }),
                new("Open pcap", new Dictionary<string, string> { ["read"] = "capture.pcap" }),
            ]));

        tools.Add(new ToolSpec(
            "ettercap", "Ettercap", "Sniffing & Spoofing", "ettercap",
            "LAN MITM suite.",
            [
                Fields.Flag("text", "Text UI", "-T"),
                Fields.Flag("quiet", "Quiet", "-q"),
                Fields.Iface(),
                Fields.Select("mitm", "MITM method", "-M", "arp", "arp:remote", "dhcp", "icmp", "port"),
                Fields.Text("plugin", "Plugin", "-P", "dns_spoof"),
                Fields.Text("write", "Write pcap", "-w", "ettercap.pcap"),
                Fields.Flag("unoffensive", "Unoffensive (sniff only)", "-o"),
                Fields.Flag("noPromisc", "No promiscuous", "-p"),
                new("t1", "Target 1", FieldKind.Text, "", Default: "//", Placeholder: "/10.0.0.1//", Positional: true),
                new("t2", "Target 2", FieldKind.Text, "", Default: "//", Placeholder: "/10.0.0.254//", Positional: true),
            ],
            [
                new("Text ARP", new Dictionary<string, string> { ["text"] = "true", ["quiet"] = "true", ["mitm"] = "arp" }),
                new("ARP remote", new Dictionary<string, string> { ["text"] = "true", ["mitm"] = "arp:remote" }),
                new("Sniff only", new Dictionary<string, string> { ["text"] = "true", ["quiet"] = "true", ["unoffensive"] = "true" }),
            ]));

        tools.Add(new ToolSpec(
            "binwalk", "Binwalk", "Forensics", "binwalk",
            "Firmware and file-carve analyzer.",
            [
                Fields.InputFile("Firmware / image"),
                Fields.Flag("extract", "Extract", "-e"),
                Fields.Flag("matryoshka", "Recursive extract", "-M"),
                Fields.Flag("entropy", "Entropy plot", "-E"),
                Fields.Flag("signature", "Signature scan", "-B"),
                Fields.Text("dd", "Carve pattern", "--dd", ".*"),
                Fields.Text("directory", "Extract dir", "-C", "binwalk-out"),
                Fields.Flag("rm", "Remove carved leftovers", "--rm"),
                Fields.Flag("quiet", "Quiet", "-q"),
            ],
            [
                new("Extract", new Dictionary<string, string> { ["extract"] = "true", ["matryoshka"] = "true" }),
                new("Entropy", new Dictionary<string, string> { ["entropy"] = "true" }),
                new("Extract + clean", new Dictionary<string, string> { ["extract"] = "true", ["matryoshka"] = "true", ["rm"] = "true" }),
            ]));

        tools.Add(new ToolSpec(
            "volatility3", "Volatility 3", "Forensics", "vol",
            "Memory forensics (Volatility 3).",
            [
                new("file", "Memory image", FieldKind.Text, "-f", Required: true, Placeholder: "memory.dmp"),
                new("plugin", "Plugin", FieldKind.Text, "", Required: true, Default: "windows.pslist", Placeholder: "windows.pslist", Positional: true),
                Fields.Text("outputDir", "Output directory", "-o", "vol-out"),
                Fields.Select("renderer", "Renderer", "--renderer", "pretty", "json", "csv"),
                Fields.Text("pluginDir", "Plugin directory", "-p", "/usr/lib/python3/dist-packages/volatility3/plugins"),
                Fields.Verbose(),
            ],
            [
                new("pslist", new Dictionary<string, string> { ["plugin"] = "windows.pslist" }),
                new("netstat", new Dictionary<string, string> { ["plugin"] = "windows.netstat" }),
                new("malfind", new Dictionary<string, string> { ["plugin"] = "windows.malfind" }),
            ]));

        tools.Add(new ToolSpec(
            "foremost", "foremost", "Forensics", "foremost",
            "File carver by headers and footers.",
            [
                new("input", "Input image", FieldKind.Text, "-i", Required: true, Placeholder: "disk.dd"),
                Fields.Text("output", "Output directory", "-o", "foremost-out"),
                Fields.Text("types", "Types", "-t", "jpg,pdf,doc,zip"),
                Fields.Text("config", "Config file", "-c", "/etc/foremost.conf"),
                Fields.Flag("indirect", "Indirect block detect", "-d"),
                Fields.Flag("allHeaders", "All headers", "-a"),
                Fields.Flag("quiet", "Quiet", "-q"),
                Fields.Verbose(),
            ],
            [
                new("Photos", new Dictionary<string, string> { ["types"] = "jpg,gif,png,bmp" }),
                new("Docs", new Dictionary<string, string> { ["types"] = "pdf,doc,docx,xls,ppt" }),
                new("Common", new Dictionary<string, string> { ["types"] = "jpg,pdf,doc,zip,exe,html" }),
            ]));

        tools.Add(new ToolSpec(
            "radare2", "radare2", "Reverse Engineering", "r2",
            "Reverse-engineering framework.",
            [
                Fields.InputFile("Binary"),
                Fields.Flag("analyze", "Analyze on start", "-A"),
                Fields.Flag("write", "Write mode", "-w"),
                Fields.Flag("quiet", "Quiet", "-q"),
                Fields.Text("script", "Script file", "-i", "script.r2"),
                Fields.Text("project", "Project", "-p", "r2proj"),
                Fields.Flag("binInfo", "Binary info and exit", "-I"),
            ],
            [
                new("Analyze", new Dictionary<string, string> { ["analyze"] = "true" }),
                new("Write + analyze", new Dictionary<string, string> { ["analyze"] = "true", ["write"] = "true" }),
                new("Quiet analyze", new Dictionary<string, string> { ["analyze"] = "true", ["quiet"] = "true" }),
            ]));

        tools.Add(new ToolSpec(
            "gdb", "GDB", "Reverse Engineering", "gdb",
            "GNU debugger.",
            [
                Fields.InputFile("Binary"),
                Fields.Flag("quiet", "Quiet", "-q"),
                Fields.Flag("nx", "Skip .gdbinit", "--nx"),
                Fields.Flag("write", "Write to binary", "--write"),
                Fields.Flag("batch", "Batch", "--batch"),
                Fields.Text("core", "Core file", "-c", "core"),
                Fields.Text("commandFile", "Command file", "-x", "gdb.cmd"),
                Fields.Text("directory", "Source directory", "-d", "."),
            ],
            [
                new("Quiet", new Dictionary<string, string> { ["quiet"] = "true" }),
                new("Batch", new Dictionary<string, string> { ["batch"] = "true", ["quiet"] = "true" }),
                new("No init", new Dictionary<string, string> { ["quiet"] = "true", ["nx"] = "true" }),
            ]));
    }
}
