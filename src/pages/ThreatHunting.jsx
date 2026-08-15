import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Play,
  Clock
} from "lucide-react";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { toast } from "sonner";

const HypothesisCard = ({ hypothesis, onExecute }) => {
  const difficultyColors = {
    beginner: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    intermediate: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
    advanced: 'bg-purple-500/20 text-purple-400 border-purple-500/50'
  };
  const c = difficultyColors[hypothesis.difficulty] || difficultyColors.intermediate;

  return (
    <Card className="hover:shadow-md transition-shadow bg-black/40 border-cyan-500/20 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <CardTitle className="text-base mb-1 text-white">{hypothesis.title}</CardTitle>
            <CardDescription className="text-xs text-slate-400">{hypothesis.description}</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={c}>
            {hypothesis.difficulty}
          </Badge>
          <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-300">
            {hypothesis.technique}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-xs text-slate-400">
            <p className="font-medium mb-1 text-slate-300">What to look for:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {(hypothesis.indicators || []).map((indicator, idx) => (
                <li key={idx}>{indicator}</li>
              ))}
            </ul>
          </div>
          <Button size="sm" className="w-full bg-cyan-600 hover:bg-cyan-700" onClick={() => onExecute(hypothesis.id)}>
            <Play className="w-3 h-3 mr-2" />
            Execute Hunt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const FindingCard = ({ finding }) => {
  const severityColors = {
    critical: 'border-red-500 bg-red-500/10',
    high: 'border-orange-500 bg-orange-500/10',
    medium: 'border-amber-500 bg-amber-500/10',
    low: 'border-cyan-500 bg-cyan-500/10'
  };
  const c = severityColors[finding.severity] || 'border-slate-500 bg-slate-500/10';

  return (
    <Card className={`border-l-4 bg-black/40 backdrop-blur-md ${c}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-base text-white">{finding.title}</CardTitle>
              <Badge className={finding.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}>
                {finding.severity}
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-400">{finding.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-xs">
          <div className="p-2 bg-black/50 text-emerald-400 rounded font-mono border border-slate-700">
            {finding.evidence}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400">First seen: {finding.timestamp}</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 border-cyan-500/50 text-cyan-300" onClick={() => toast.info('Create Alert – integrate with alerts API')}>
              Create Alert
            </Button>
            <Button size="sm" variant="outline" className="flex-1 border-cyan-500/50 text-cyan-300" onClick={() => toast.info('Investigate – integrate with incident workflow')}>
              Investigate
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ThreatHunting() {
  const [customQuery, setCustomQuery] = useState('');

  const hypotheses = [
    {
      id: '1',
      title: 'Credential Dumping',
      description: 'Hunt for tools like Mimikatz extracting credentials from memory',
      difficulty: 'intermediate',
      technique: 'T1003',
      indicators: [
        'Processes accessing LSASS memory',
        'Creation of credential dump files',
        'Known credential dumping tool signatures'
      ]
    },
    {
      id: '2',
      title: 'Living Off The Land',
      description: 'Detect abuse of legitimate Windows tools for malicious purposes',
      difficulty: 'advanced',
      technique: 'T1218',
      indicators: [
        'PowerShell with encoded commands',
        'Unusual WMI activity',
        'Suspicious certutil or bitsadmin usage'
      ]
    },
    {
      id: '3',
      title: 'C2 Beaconing',
      description: 'Identify command and control communication patterns',
      difficulty: 'intermediate',
      technique: 'T1071',
      indicators: [
        'Regular outbound connections at fixed intervals',
        'Unusual DNS queries',
        'HTTP(S) traffic to suspicious domains'
      ]
    },
    {
      id: '4',
      title: 'Persistence Mechanisms',
      description: 'Find methods attackers use to maintain access',
      difficulty: 'beginner',
      technique: 'T1547',
      indicators: [
        'New scheduled tasks',
        'Registry run keys modifications',
        'Suspicious startup items'
      ]
    }
  ];

  const recentFindings = [
    {
      id: '1',
      title: 'Suspicious PowerShell Execution',
      description: 'PowerShell with encoded command and network activity detected',
      severity: 'high',
      evidence: 'powershell.exe -enc JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0...',
      timestamp: '2026-01-30 14:45:22'
    },
    {
      id: '2',
      title: 'Unusual Outbound Connection',
      description: 'Non-browser process connecting to external IP on port 443',
      severity: 'medium',
      evidence: 'svchost.exe -> 45.33.32.156:443 (Repeated every 5 minutes)',
      timestamp: '2026-01-30 14:12:08'
    },
    {
      id: '3',
      title: 'Registry Persistence',
      description: 'New registry run key added by suspicious process',
      severity: 'high',
      evidence: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\UpdaterService',
      timestamp: '2026-01-30 13:58:44'
    }
  ];

  const handleExecuteHunt = (id) => {
    toast.info('Executing threat hunt across all endpoints...');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Threat Hunting"
        description="Proactively search for hidden threats and suspicious patterns"
      />

      {/* Info Banner */}
      <Card className="border-blue-500/30 bg-black/20 backdrop-blur-md">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-900 text-sm mb-1">What is Threat Hunting?</p>
              <p className="text-xs text-blue-700">
                Threat hunting is the proactive search for cyber threats hiding in your network. Instead of waiting for alerts, 
                you form hypotheses about potential attacker behavior and actively search for evidence. Think like an attacker to find them.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-xs text-slate-600">Active Hunts</p>
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
                <p className="text-2xl font-bold">8</p>
                <p className="text-xs text-slate-600">Findings Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">156</p>
                <p className="text-xs text-slate-600">Hunts Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">92%</p>
                <p className="text-xs text-slate-600">Detection Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Query */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Threat Hunt</CardTitle>
          <CardDescription>
            Write your own query to search for specific indicators
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: Find all processes with network connections where process_name != 'chrome.exe' AND dest_port = 443"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            className="min-h-[100px] font-mono text-sm"
          />
          <Button className="w-full">
            <Search className="w-4 h-4 mr-2" />
            Execute Custom Hunt
          </Button>
        </CardContent>
      </Card>

      {/* Hunt Hypotheses */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Threat Hunt Library</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hypotheses.map((hypothesis) => (
            <HypothesisCard
              key={hypothesis.id}
              hypothesis={hypothesis}
              onExecute={handleExecuteHunt}
            />
          ))}
        </div>
      </div>

      {/* Recent Findings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Findings</CardTitle>
          <CardDescription>
            Threats discovered during recent hunts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentFindings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}