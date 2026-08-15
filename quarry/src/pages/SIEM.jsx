import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Search,
  AlertTriangle,
  Download,
  Shield,
  Server
} from "lucide-react";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { api } from '@/api/client';
import { useQuery } from '@tanstack/react-query';

const LogEntry = ({ log }) => {
  const severityColors = {
    critical: 'border-red-500 bg-red-500/10 text-red-300',
    high: 'border-orange-500 bg-orange-500/10 text-orange-300',
    medium: 'border-amber-500 bg-amber-500/10 text-amber-300',
    low: 'border-cyan-500 bg-cyan-500/10 text-cyan-300',
    info: 'border-slate-500 bg-slate-500/10 text-slate-300'
  };
  const badgeColors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/50',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    low: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
    info: 'bg-slate-500/20 text-slate-400 border-slate-500/50'
  };
  const c = severityColors[log.severity] || severityColors.info;
  const b = badgeColors[log.severity] || badgeColors.info;

  return (
    <div className={`border-l-4 p-3 rounded bg-black/30 ${c}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge className={b}>
            {(log.severity || 'info').toUpperCase()}
          </Badge>
          <span className="text-xs text-slate-400">{log.timestamp}</span>
        </div>
        <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-300">
          {log.source}
        </Badge>
      </div>
      <p className="text-sm font-medium mb-1 text-slate-100">{log.message}</p>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span>Source IP: {log.sourceIp}</span>
        {log.destIp && <span>• Dest IP: {log.destIp}</span>}
        {log.user && <span>• User: {log.user}</span>}
      </div>
    </div>
  );
};

const CorrelationRule = ({ rule }) => {
  return (
    <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base mb-1 text-white">{rule.name}</CardTitle>
            <CardDescription className="text-xs text-slate-400">{rule.description}</CardDescription>
          </div>
          <Badge className={rule.enabled ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-500/20 text-slate-400 border-slate-500/50'}>
            {rule.enabled ? 'Active' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Triggers:</span>
            <span className="font-semibold text-cyan-300">{rule.triggers} times (24h)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Severity:</span>
            <Badge variant="outline" className="border-cyan-500/50 text-cyan-300">{rule.severity}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function hoursForRange(range) {
  if (range === '7d') return 24 * 7;
  if (range === '30d') return 24 * 30;
  return 24;
}

export default function SIEM() {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('24h');

  const { data: recentLogs = [] } = useQuery({
    queryKey: ['siem-events'],
    queryFn: () => api.entities.SiemEvent.list(),
    refetchInterval: 8000,
  });

  const { data: correlationRules = [] } = useQuery({
    queryKey: ['siem-rules'],
    queryFn: () => api.entities.CorrelationRule.list(),
  });

  const cutoff = Date.now() - hoursForRange(timeRange) * 3600_000;
  const filteredLogs = recentLogs.filter((log) => {
    const ts = new Date(log.created_date || log.timestamp).getTime();
    if (!Number.isNaN(ts) && ts < cutoff) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const ipMatch = q.startsWith('sourceip:') ? (log.sourceIp || '').includes(q.slice(9).trim()) : true;
    const text = `${log.message} ${log.source} ${log.sourceIp} ${log.user || ''}`.toLowerCase();
    return ipMatch && (q.startsWith('sourceip:') || text.includes(q));
  });

  const sources = Object.entries(
    recentLogs.reduce((acc, log) => {
      acc[log.source] = (acc[log.source] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count, icon: name.includes('Firewall') ? Shield : name.includes('IDS') ? AlertTriangle : Server }));

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'seraphim-siem-events.json';
    a.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SIEM & Log Analysis"
        description="Security Information and Event Management - Centralized logging and correlation"
        actions={
          <Button variant="outline" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredLogs.length}</p>
                <p className="text-xs text-slate-600">Events in range</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredLogs.filter((l) => l.severity === 'critical').length}</p>
                <p className="text-xs text-slate-600">Critical Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{correlationRules.length}</p>
                <p className="text-xs text-slate-600">Correlation Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Server className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sources.length}</p>
                <p className="text-xs text-slate-600">Log Sources</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search logs... (e.g., 'failed login' OR sourceIp:45.33.32.156)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <select
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <Button>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="logs">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="logs">Real-time Logs</TabsTrigger>
          <TabsTrigger value="correlation">Correlation Rules</TabsTrigger>
          <TabsTrigger value="sources">Log Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-6 space-y-3">
          {filteredLogs.length === 0 ? (
            <p className="text-sm text-slate-400">No events in this range. Run an attack simulation or recon scan to ingest logs.</p>
          ) : filteredLogs.map((log) => (
            <LogEntry key={log.id} log={log} />
          ))}
        </TabsContent>

        <TabsContent value="correlation" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {correlationRules.map((rule) => (
              <CorrelationRule key={rule.id} rule={rule} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sources" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sources.map((source) => (
              <Card key={source.name}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <source.icon className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{source.name}</p>
                      <p className="text-xs text-slate-500">{source.count} events stored</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}