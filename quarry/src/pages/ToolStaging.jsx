import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Database, History, Zap, Search, Loader2 } from 'lucide-react';
import { api } from '@/api/client';
import { toast } from 'sonner';
import ToolStagingManager from '@/components/tools/ToolStagingManager';
import PayloadModuleBuilder from '@/components/tools/PayloadModuleBuilder';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

function ToolScanExecutor({ team }) {
  const [target, setTarget] = useState('');
  const [toolName, setToolName] = useState('nmap');
  const [profile, setProfile] = useState('basic');
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);

  const handleRunScan = async () => {
    const t = target?.trim();
    if (!t) {
      toast.error('Enter a target (IP, hostname, or CIDR)');
      return;
    }
    setScanning(true);
    setLastResult(null);
    try {
      const { data } = await api.functions.invoke('toolOrchestratorScan', {
        tool_name: toolName,
        target: t,
        profile,
      });
      setLastResult(data);
      setScanHistory(prev => [{ ...data, target: t, profile }, ...prev.slice(0, 9)]);
      toast.success('Scan completed');
    } catch (e) {
      const errMsg = e?.message || e?.response?.data?.error || '';
      if (errMsg.includes('not configured') && toolName === 'nmap') {
        try {
          const { data } = await api.functions.invoke('nmapScan', { target: t, profile, timeout: 300 });
          setLastResult(data);
          setScanHistory(prev => [{ ...data, target: t, profile }, ...prev.slice(0, 9)]);
          toast.success('Scan completed (via nmap)');
        } catch (fallbackErr) {
          toast.error(fallbackErr?.message || 'Scan failed');
        }
      } else {
        toast.error(errMsg || 'Scan failed');
      }
    } finally {
      setScanning(false);
    }
  };

  const borderClass = team === 'blue' ? 'border-cyan-500/50' : 'border-red-500/50';
  return (
    <div className="space-y-6">
      <Card className={cn('bg-black/40 backdrop-blur-md border', borderClass)}>
        <CardHeader>
          <CardTitle className="text-white">Execute Tool Scan</CardTitle>
          <CardDescription className="text-slate-400">
            Run configured tools via toolOrchestratorScan (falls back to nmapScan if tool not configured)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-300">Tool</Label>
              <Select value={toolName} onValueChange={setToolName}>
                <SelectTrigger className="mt-1 bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="nmap">Nmap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Target</Label>
              <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="192.168.1.1 or example.com" className="mt-1 bg-slate-900 border-slate-700 text-white" />
            </div>
            <div>
              <Label className="text-slate-300">Profile</Label>
              <Select value={profile} onValueChange={setProfile}>
                <SelectTrigger className="mt-1 bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="deep">Deep</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleRunScan} disabled={scanning} className={cn('w-full', team === 'blue' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-red-600 hover:bg-red-700')}>
            {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            {scanning ? 'Scanning...' : 'Run Scan'}
          </Button>
        </CardContent>
      </Card>
      {lastResult && (
        <Card className={cn('bg-black/40 backdrop-blur-md border', borderClass)}>
          <CardHeader>
            <CardTitle className="text-white">Last Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-slate-900 rounded text-xs text-green-400 overflow-auto max-h-64">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
      {scanHistory.length > 0 && (
        <Card className={cn('bg-black/40 backdrop-blur-md border', borderClass)}>
          <CardHeader>
            <CardTitle className="text-white">Execution History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {scanHistory.map((s, i) => (
                <div key={i} className="p-2 bg-slate-800/50 rounded text-sm">
                  <span className="font-mono text-slate-300">{s.target}</span>
                  <span className="text-slate-500 ml-2">• {s.profile}</span>
                  {s.status && <span className={cn('ml-2', s.status === 'completed' ? 'text-green-400' : 'text-amber-400')}>{s.status}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ToolStaging() {
  const { user } = useAuth();
  const team = user?.team || 'blue';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tool / API Staging"
        description="Centralized management of scanning and reconnaissance tools"
      />

      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList className={`bg-black/40 border ${team === 'blue' ? 'border-cyan-500/30' : 'border-red-500/30'}`}>
          <TabsTrigger value="configuration" className={`data-[state=active]:${team === 'blue' ? 'bg-cyan-600' : 'bg-red-600'}`}>
            <Settings className="w-4 h-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="integrations" className={`data-[state=active]:${team === 'blue' ? 'bg-cyan-600' : 'bg-red-600'}`}>
            <Database className="w-4 h-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="history" className={`data-[state=active]:${team === 'blue' ? 'bg-cyan-600' : 'bg-red-600'}`}>
            <History className="w-4 h-4 mr-2" />
            Execution History
          </TabsTrigger>
          <TabsTrigger value="payload_gen" className={`data-[state=active]:${team === 'blue' ? 'bg-cyan-600' : 'bg-red-600'}`}>
            <Zap className="w-4 h-4 mr-2" />
            Generate Payload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-6">
          <ToolStagingManager team={team} />

          <Card className={`bg-black/40 backdrop-blur-md border ${team === 'blue' ? 'border-cyan-500/50' : 'border-red-500/50'}`}>
            <CardHeader>
              <CardTitle className="text-white">Tool Registration</CardTitle>
              <CardDescription className="text-slate-400">
                Each tool is registered with execution mode, API configuration, and permission settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm text-slate-300">
                <div>
                  <p className="font-semibold text-white mb-1">Execution Modes</p>
                  <ul className="space-y-1 pl-4">
                    <li>• <strong>external_api</strong>: Call third-party API (e.g., nmap.online)</li>
                    <li>• <strong>local_agent</strong>: Run on local infrastructure (coming soon)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Tool Configuration Includes</p>
                  <ul className="space-y-1 pl-4">
                    <li>• Base URL and API key references</li>
                    <li>• Request/response schemas for validation</li>
                    <li>• Timeout and rate limiting</li>
                    <li>• Team-based permissions (blue/red/both)</li>
                    <li>• Metadata for tool-specific options</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card className={`bg-black/40 backdrop-blur-md border ${team === 'blue' ? 'border-cyan-500/50' : 'border-red-500/50'}`}>
            <CardHeader>
              <CardTitle className="text-white">Available Integrations</CardTitle>
              <CardDescription className="text-slate-400">
                Configured tool integrations and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-slate-800/30 rounded border border-slate-700">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-white">Nmap</h4>
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Active</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">Network reconnaissance and port scanning</p>
                  <p className="text-xs text-slate-500 font-mono">https://nmap.online/api/scan</p>
                </div>

                <div className="p-3 bg-slate-800/30 rounded border border-slate-700">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-white">WHOIS</h4>
                    <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">Planned</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">Domain registration and ownership information</p>
                  <p className="text-xs text-slate-500">Integration pending</p>
                </div>

                <div className="p-3 bg-slate-800/30 rounded border border-slate-700">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-white">DNS Lookup</h4>
                    <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">Planned</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">DNS record resolution and enumeration</p>
                  <p className="text-xs text-slate-500">Integration pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <ToolScanExecutor team={team} />
        </TabsContent>

        <TabsContent value="payload_gen" className="space-y-6">
          <PayloadModuleBuilder team={team} />
        </TabsContent>
        </Tabs>
        </div>
        );
        }