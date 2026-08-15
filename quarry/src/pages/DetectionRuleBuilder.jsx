import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { Plus, Copy, Play } from 'lucide-react';
import { toast } from 'sonner';

const RuleCard = ({ rule, onTest }) => (
  <Card className="bg-transparent backdrop-blur-md border border-cyan-500/20">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div>
          <CardTitle className="text-white text-sm">{rule.name}</CardTitle>
          <p className="text-xs text-cyan-200/70 mt-1">{rule.type}</p>
        </div>
        <Badge className={rule.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}>
          {rule.enabled ? 'Active' : 'Disabled'}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-2">
      <code className="text-xs text-slate-400 block p-2 bg-black/50 rounded border border-slate-700 overflow-x-auto">
        {rule.query?.length > 50 ? `${rule.query.substring(0, 50)}...` : (rule.query || '')}
      </code>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => {
          navigator.clipboard.writeText(rule.query || '');
          toast.success('Copied to clipboard');
        }}>
          <Copy className="w-3 h-3 mr-1" />
          Copy
        </Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={() => onTest?.(rule)}>
          <Play className="w-3 h-3 mr-1" />
          Test
        </Button>
      </div>
    </CardContent>
  </Card>
);

const PLATFORMS = ['SIEM (Splunk/ELK)', 'EDR (CrowdStrike)', 'Network (Zeek)', 'Sigma'];
const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];

export default function DetectionRuleBuilder() {
  const [rules, setRules] = useState([
    {
      id: 1,
      name: 'PowerShell Obfuscation',
      type: 'SIEM Rule',
      query: 'event.command_line:(*-nop* OR *-w* OR *hidden*) AND process.name:powershell.exe',
      enabled: true
    },
    {
      id: 2,
      name: 'Suspicious Registry Modification',
      type: 'EDR Rule',
      query: 'registry.path:"*\\Run" AND (registry.value:cmd.exe OR registry.value:powershell.exe)',
      enabled: true
    },
    {
      id: 3,
      name: 'Lateral Movement Detection',
      type: 'Network Rule',
      query: 'network.protocol:RDP AND (source.ip:10.* OR source.ip:172.*) AND destination.port:3389',
      enabled: false
    }
  ]);
  const [form, setForm] = useState({
    name: '',
    platform: PLATFORMS[0],
    severity: SEVERITIES[0],
    query: ''
  });

  const handleSaveRule = () => {
    if (!form.name.trim() || !form.query.trim()) {
      toast.error('Rule name and detection query are required');
      return;
    }
    const newRule = {
      id: Date.now(),
      name: form.name.trim(),
      type: form.platform,
      query: form.query.trim(),
      enabled: true
    };
    setRules(prev => [newRule, ...prev]);
    setForm({ name: '', platform: PLATFORMS[0], severity: SEVERITIES[0], query: '' });
    toast.success('Rule saved to library (local). Configure backend to persist.');
  };

  const handleTestRule = (rule) => {
    toast.info(`Test run for "${rule.name}" – integrate with SIEM/EDR API to execute query`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detection Rule Builder"
        description="Create SIEM, EDR, and network detection rules from attack indicators"
        actions={
          <Button
            className="bg-cyan-600 hover:bg-cyan-700"
            onClick={() => setForm({ name: '', platform: PLATFORMS[0], severity: SEVERITIES[0], query: '' })}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Rule
          </Button>
        }
      />

      {/* Rule Creation Form */}
      <Card className="bg-transparent backdrop-blur-md border border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-white">Create Detection Rule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Rule Name</label>
            <Input
              placeholder="e.g., Suspicious PowerShell Execution"
              className="bg-black/50 border-slate-700"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Platform</label>
              <select
                className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200"
                value={form.platform}
                onChange={(e) => setForm(f => ({ ...f, platform: e.target.value }))}
              >
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Severity</label>
              <select
                className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200"
                value={form.severity}
                onChange={(e) => setForm(f => ({ ...f, severity: e.target.value }))}
              >
                {SEVERITIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">Detection Query</label>
            <Textarea
              placeholder="Enter your detection query..."
              className="bg-black/50 border-slate-700 font-mono text-xs min-h-24"
              value={form.query}
              onChange={(e) => setForm(f => ({ ...f, query: e.target.value }))}
            />
          </div>
          <Button className="w-full bg-cyan-600 hover:bg-cyan-700" onClick={handleSaveRule}>
            Save Rule
          </Button>
        </CardContent>
      </Card>

      {/* Rules Library */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Detection Rules Library</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rules.map(rule => (
            <RuleCard key={rule.id} rule={rule} onTest={handleTestRule} />
          ))}
        </div>
      </div>

      {/* Rule Performance */}
      <Card className="bg-transparent backdrop-blur-md border border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-white">Rule Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-black/50 rounded border border-slate-700">
            <span className="text-sm text-slate-200">True Positive Rate</span>
            <span className="text-sm font-bold text-cyan-400">94%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-black/50 rounded border border-slate-700">
            <span className="text-sm text-slate-200">False Positive Rate</span>
            <span className="text-sm font-bold text-amber-400">6%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-black/50 rounded border border-slate-700">
            <span className="text-sm text-slate-200">Avg Detection Time</span>
            <span className="text-sm font-bold text-slate-300">2.3 minutes</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}