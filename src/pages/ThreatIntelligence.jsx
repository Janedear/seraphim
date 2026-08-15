import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  AlertTriangle,
  Download,
  Upload,
  CheckCircle2,
  Plus,
  Trash2,
  RefreshCw
} from "lucide-react";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { toast } from "sonner";

const FeedCard = ({ feed, onToggle, onUpdate }) => {
  const statusColors = {
    active: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
    syncing: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    failed: 'bg-red-500/20 text-red-300 border-red-500/50',
    disabled: 'bg-slate-700/20 text-slate-400 border-slate-600/50'
  };

  return (
    <Card className="hover:shadow-[0_0_40px_rgba(0,186,255,0.3)] transition-all bg-black/40 backdrop-blur-md border-cyan-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base text-white">{feed.name}</CardTitle>
              <Badge className={`${statusColors[feed.status]} border`}>
                {feed.status}
              </Badge>
            </div>
            <CardDescription className="text-xs mt-1 text-cyan-200/70">{feed.description}</CardDescription>
          </div>
          <Switch
            checked={feed.enabled}
            onCheckedChange={(checked) => onToggle(feed.id, checked)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-xs text-cyan-200">
          <div className="flex items-center justify-between">
            <span>Signatures:</span>
            <span className="font-mono font-medium">{feed.signatures?.toLocaleString() || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Last Updated:</span>
            <span>{feed.lastUpdate || 'Never'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Privacy Mode:</span>
            <span className="flex items-center gap-1">
              {feed.privacyMode ? (
                <>
                  <Lock className="w-3 h-3 text-green-600" />
                  <span className="text-green-600 font-medium">Enabled</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span className="text-amber-600">Disabled</span>
                </>
              )}
            </span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onUpdate(feed.id)}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Update
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const YaraRuleEditor = ({ rules, onAdd, onDelete }) => {
  const [newRule, setNewRule] = useState('');
  const [ruleName, setRuleName] = useState('');

  const handleAdd = () => {
    if (!ruleName || !newRule) {
      toast.error('Please provide both rule name and content');
      return;
    }
    onAdd({ name: ruleName, content: newRule });
    setRuleName('');
    setNewRule('');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <Label>Rule Name</Label>
          <Input
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            placeholder="e.g., detect_ransomware_v2"
            className="mt-1 font-mono"
          />
        </div>
        <div>
          <Label>YARA Rule</Label>
          <Textarea
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            placeholder="rule detect_malware { strings: $a = { 4D 5A } condition: $a }"
            className="mt-1 font-mono text-xs h-32"
          />
        </div>
        <Button onClick={handleAdd} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Rule
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Active Rules ({rules.length})</Label>
        {rules.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No custom YARA rules configured
          </div>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-mono text-sm font-medium">{rule.name}</p>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      {rule.content.substring(0, 60)}...
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(rule.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default function ThreatIntelligence() {
  const [feeds, setFeeds] = useState([
    {
      id: '1',
      name: 'Private CVE Database',
      description: 'On-premise vulnerability database, no external communication',
      enabled: true,
      status: 'active',
      signatures: 185432,
      lastUpdate: '2 hours ago',
      privacyMode: true
    },
    {
      id: '2',
      name: 'Zero-Day Heuristics Engine',
      description: 'Local behavioral analysis, fully offline',
      enabled: true,
      status: 'active',
      signatures: 42891,
      lastUpdate: '1 hour ago',
      privacyMode: true
    },
    {
      id: '3',
      name: 'Dark Web IOC Feed',
      description: 'Air-gapped sync, encrypted transfer only',
      enabled: true,
      status: 'syncing',
      signatures: 98234,
      lastUpdate: '15 minutes ago',
      privacyMode: true
    },
    {
      id: '4',
      name: 'Rootkit Signatures',
      description: 'Advanced persistent threat detection',
      enabled: true,
      status: 'active',
      signatures: 15678,
      lastUpdate: '3 hours ago',
      privacyMode: true
    },
    {
      id: '5',
      name: 'Memory Forensics Patterns',
      description: 'In-memory malware detection',
      enabled: false,
      status: 'disabled',
      signatures: 8921,
      lastUpdate: 'Yesterday',
      privacyMode: true
    }
  ]);

  const [yaraRules, setYaraRules] = useState([
    {
      id: '1',
      name: 'detect_ransomware_crypto',
      content: 'rule detect_ransomware_crypto { strings: $enc = "CryptEncrypt" $key = "CryptGenKey" condition: all of them }'
    }
  ]);

  const [iocList, setIocList] = useState([
    { id: '1', type: 'hash', value: 'a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9', severity: 'critical', source: 'dark_web' },
    { id: '2', type: 'ip', value: '45.33.32.156', severity: 'high', source: 'c2_database' },
    { id: '3', type: 'domain', value: 'malicious-site[.]com', severity: 'medium', source: 'private_feed' }
  ]);

  const handleToggleFeed = (id, enabled) => {
    setFeeds(feeds.map(f => f.id === id ? { ...f, enabled } : f));
    toast.success(enabled ? 'Feed enabled' : 'Feed disabled');
  };

  const handleUpdateFeed = (id) => {
    toast.success('Feed update initiated');
  };

  const handleAddYaraRule = (rule) => {
    setYaraRules([...yaraRules, { ...rule, id: Date.now().toString() }]);
    toast.success('YARA rule added successfully');
  };

  const handleDeleteYaraRule = (id) => {
    setYaraRules(yaraRules.filter(r => r.id !== id));
    toast.success('YARA rule deleted');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Threat Intelligence"
        description="Configure private threat feeds and detection engines"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-cyan-500/30 hover:bg-cyan-500/10">
              <Download className="w-4 h-4 mr-2" />
              Export Config
            </Button>
            <Button variant="outline" size="sm" className="border-cyan-500/30 hover:bg-cyan-500/10">
              <Upload className="w-4 h-4 mr-2" />
              Import Feeds
            </Button>
          </div>
        }
      />

      {/* Privacy Banner */}
      <Card className="border-cyan-500/30 bg-cyan-500/5 backdrop-blur-md">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,186,255,0.3)]">
              <Lock className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">Zero-Trust Privacy Mode Active</p>
              <p className="text-sm text-cyan-100">All threat intelligence processing occurs locally. No data leaves your network.</p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-cyan-400" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="feeds">
        <TabsList className="bg-black/40 border border-cyan-500/30">
          <TabsTrigger value="feeds" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Threat Feeds</TabsTrigger>
          <TabsTrigger value="yara" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">YARA Rules</TabsTrigger>
          <TabsTrigger value="ioc" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">IOC Management</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Privacy Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="feeds" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeds.map((feed) => (
              <FeedCard
                key={feed.id}
                feed={feed}
                onToggle={handleToggleFeed}
                onUpdate={handleUpdateFeed}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="yara" className="mt-6">
          <Card className="bg-black/40 backdrop-blur-md border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white">Custom YARA Rules</CardTitle>
              <CardDescription className="text-cyan-200/70">
                Create custom detection rules for advanced threats. All processing happens on-device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <YaraRuleEditor
                rules={yaraRules}
                onAdd={handleAddYaraRule}
                onDelete={handleDeleteYaraRule}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ioc" className="mt-6">
          <Card className="bg-black/40 backdrop-blur-md border-cyan-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Indicators of Compromise</CardTitle>
                  <CardDescription className="text-cyan-200/70">
                    Manage custom IOCs from private threat intelligence sources
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add IOC
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {iocList.map((ioc) => (
                  <div key={ioc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{ioc.type}</Badge>
                        <Badge className={
                          ioc.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          ioc.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {ioc.severity}
                        </Badge>
                      </div>
                      <p className="font-mono text-sm">{ioc.value}</p>
                      <p className="text-xs text-slate-500">Source: {ioc.source}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-6">
          <Card className="bg-black/40 backdrop-blur-md border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white">Privacy & Security Settings</CardTitle>
              <CardDescription className="text-cyan-200/70">
                Configure how threat intelligence data is handled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <Label className="text-sm font-medium">Air-Gapped Mode</Label>
                  <p className="text-xs text-slate-500">Completely offline operation, manual updates only</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <Label className="text-sm font-medium">Local Processing Only</Label>
                  <p className="text-xs text-slate-500">Never send files or data to external servers</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <Label className="text-sm font-medium">Encrypted Feed Updates</Label>
                  <p className="text-xs text-slate-500">Require TLS 1.3 and certificate pinning</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <Label className="text-sm font-medium">Telemetry Blocking</Label>
                  <p className="text-xs text-slate-500">Block all outbound telemetry and analytics</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <Label className="text-sm font-medium">Zero-Knowledge Architecture</Label>
                  <p className="text-xs text-slate-500">All encryption keys stay on-premise</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}