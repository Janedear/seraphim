import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import PageHeader from '@/components/ui-custom/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Shield,
  Search,
  Bug,
  Target,
  Key,
  Database,
  Wrench,
  Mail,
  FileCode,
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const INTEGRATIONS = [
  {
    id: 'virustotal',
    name: 'VirusTotal (Malware Sandbox)',
    description: 'Analyze files and hashes for malware. Free tier: 4 req/min.',
    secret: 'VIRUSTOTAL_API_KEY',
    link: 'https://www.virustotal.com/gui/my-apikey',
    page: 'MalwareSandbox',
    icon: Bug,
    testFn: async () => {
      try {
        const { data } = await api.functions.invoke('analyzeMalware', { hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' });
        return data?.configured !== false && !data?.error?.toLowerCase?.().includes('not configured');
      } catch {
        return false;
      }
    },
  },
  {
    id: 'abuseipdb',
    name: 'AbuseIPDB (OSINT / Attacker Intelligence)',
    description: 'IP reputation and threat intel. Free tier: 1000 req/day.',
    secret: 'ABUSEIPDB_API_KEY',
    link: 'https://www.abuseipdb.com/api',
    page: 'AttackerIntelligence',
    icon: Search,
    testFn: async () => {
      try {
        const { data } = await api.functions.invoke('osintLookup', { ip: '8.8.8.8' });
        return !data?.error?.toLowerCase?.().includes('not configured');
      } catch {
        return false;
      }
    },
  },
  {
    id: 'attack-sim',
    name: 'Attack Simulation API',
    description: 'Run red-team attack simulations. Requires external API.',
    secret: 'ATTACK_SIMULATION_API_URL + ATTACK_SIMULATION_API_KEY',
    link: null,
    page: 'AttackSimulations',
    icon: Target,
    testFn: async () => {
      try {
        const { data } = await api.functions.invoke('runAttackSimulation', { simulationType: 'connectivity', target: '127.0.0.1' });
        return data?.configured !== false && !data?.error?.toLowerCase?.().includes('not configured');
      } catch {
        return false;
      }
    },
  },
  {
    id: 'disassembly',
    name: 'Disassembly API (CutterLite)',
    description: 'Binary disassembly via Capstone/Keystone. Optional; LLM fallback available.',
    secret: 'DISASSEMBLY_API_URL',
    link: null,
    page: 'ReverseEngineering',
    icon: FileCode,
    testFn: async () => {
      try {
        const { data } = await api.functions.invoke('disassembleBinary', { bytesBase64: 'AAAA' });
        return !!data?.disassembly && !String(data.disassembly).includes('Configure DISASSEMBLY');
      } catch {
        return false;
      }
    },
    optional: true,
  },
  {
    id: 'phishing',
    name: 'Phishing Campaigns',
    description: 'List campaigns from the PhishingCampaign entity.',
    secret: 'PhishingCampaign entity',
    link: null,
    page: 'PhishingCampaigns',
    icon: Mail,
    testFn: async () => {
      try {
        const { data } = await api.functions.invoke('listPhishingCampaigns', {});
        return data?.success !== false && !data?.message?.toLowerCase?.().includes('not configured');
      } catch {
        return false;
      }
    },
  },
  {
    id: 'honeypots',
    name: 'Honeypots',
    description: 'List honeypots from the Honeypot entity.',
    secret: 'Honeypot entity',
    link: null,
    page: 'HoneypotManager',
    icon: Shield,
    testFn: async () => {
      try {
        const { data } = await api.functions.invoke('listHoneypots', {});
        return data?.success !== false && !data?.message?.toLowerCase?.().includes('not configured');
      } catch {
        return false;
      }
    },
  },
  {
    id: 'breach-vip',
    name: 'Breach.vip (Breach Recon)',
    description: 'Search breach databases. Optional; set BREACH_VIP_API_KEY if required.',
    secret: 'BREACH_VIP_API_KEY',
    link: 'https://breach.vip',
    page: 'BreachRecon',
    icon: Database,
    testFn: async () => true,
    optional: true,
  },
];

function IntegrationCard({ integration, status, onTest, testing }) {
  const Icon = integration.icon;
  const isOk = status === 'ok';

  return (
    <Card className={`border ${isOk ? 'border-green-500/30 bg-green-950/20' : 'border-slate-700 bg-slate-900/50'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isOk ? 'bg-green-500/20' : 'bg-slate-800'}`}>
              <Icon className={`w-5 h-5 ${isOk ? 'text-green-400' : 'text-slate-400'}`} />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {integration.name}
                {integration.optional && (
                  <Badge variant="outline" className="text-xs font-normal">Optional</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-sm mt-0.5">{integration.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status === 'unknown' && (
              <Button size="sm" variant="outline" onClick={() => onTest(integration)} disabled={testing}>
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
              </Button>
            )}
            {status === 'ok' && <CheckCircle2 className="w-6 h-6 text-green-500" />}
            {status === 'fail' && <XCircle className="w-6 h-6 text-red-500" />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Key className="w-3.5 h-3.5" />
          <span>Set in project function secrets: {integration.secret}</span>
        </div>
        <div className="flex gap-2">
          {integration.link && (
            <Button size="sm" variant="outline" asChild>
              <a href={integration.link} target="_blank" rel="noopener noreferrer">
                Get API Key <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            </Button>
          )}
          <Button size="sm" variant="ghost" asChild>
            <Link to={createPageUrl(integration.page)}>Open {integration.page}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function IntegrationSetup() {
  const [statuses, setStatuses] = useState({});
  const [testing, setTesting] = useState(null);
  const [testingAll, setTestingAll] = useState(false);

  const runTest = async (integration) => {
    setTesting(integration.id);
    try {
      const ok = await integration.testFn();
      setStatuses((s) => ({ ...s, [integration.id]: ok ? 'ok' : 'fail' }));
      if (ok) toast.success(`${integration.name} is configured`);
      else toast.error(`${integration.name} needs configuration`);
    } catch {
      setStatuses((s) => ({ ...s, [integration.id]: 'fail' }));
      toast.error(`Test failed for ${integration.name}`);
    } finally {
      setTesting(null);
    }
  };

  const testAll = async () => {
    setTestingAll(true);
    const next = {};
    for (const i of INTEGRATIONS) {
      try {
        const ok = await i.testFn();
        next[i.id] = ok ? 'ok' : 'fail';
      } catch {
        next[i.id] = 'fail';
      }
    }
    setStatuses(next);
    setTestingAll(false);
    const okCount = Object.values(next).filter((v) => v === 'ok').length;
    toast.info(`${okCount} of ${INTEGRATIONS.length} integrations configured`);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Integration Setup"
          description="Configure external APIs and data entities to unlock full functionality"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Settings', href: createPageUrl('Settings') },
            { label: 'Integration Setup' },
          ]}
          actions={
            <Button onClick={testAll} disabled={testingAll} variant="outline">
              {testingAll ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Test All Integrations
            </Button>
          }
        />

        <Card className="border-cyan-500/30 bg-cyan-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Quick Start
            </CardTitle>
            <CardDescription>
              Most integrations require API keys or secrets in your Seraphim project. Add them under
              Settings → Integrations / function secrets using the variables listed below. Some features work
              out of the box (Recon, Password breach lookup, Nmap) with no configuration.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {INTEGRATIONS.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              status={statuses[integration.id] ?? 'unknown'}
              onTest={runTest}
              testing={testing === integration.id}
            />
          ))}
        </div>

        <Card className="border-slate-700">
          <CardHeader>
            <CardTitle>Works Without Configuration</CardTitle>
            <CardDescription>
              These features use free public APIs or built-in logic and work immediately:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>• <strong>Recon Tools</strong> – WHOIS, DNS, subdomain, SSL via HackerTarget (free)</p>
            <p>• <strong>Password Tools</strong> – SHA-1 breach lookup via Have I Been Pwned (k-anonymity, no key)</p>
            <p>• <strong>Network Scanner</strong> – Nmap via nmap.online (default)</p>
            <p>• <strong>AI Detection</strong> – Text analysis (requires AI provider in Settings)</p>
            <p>• <strong>Assembly Analyzer</strong> – Text-based analysis (no binary upload)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
