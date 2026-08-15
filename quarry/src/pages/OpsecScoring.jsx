import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { AlertCircle, CheckCircle2, AlertTriangle, Zap, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

const ScoreIndicator = ({ score, team }) => {
  let color = 'bg-red-500';
  let label = 'High Risk';
  if (score >= 75) {
    color = 'bg-emerald-500';
    label = 'Safe';
  } else if (score >= 50) {
    color = 'bg-amber-500';
    label = 'Moderate Risk';
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200">OPSEC Score</span>
        <span className={`text-2xl font-bold ${color.replace('bg-', 'text-')} drop-shadow-lg`}>{score}</span>
      </div>
      <Progress value={score} className="h-3" />
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
};

export default function OpsecScoring() {
  const { user } = useAuth();
  const team = user?.team || localStorage.getItem('secureGuardTeam') || 'blue';
  const [payloadScore] = useState(72);

  const checks = [
    {
      name: 'Signature Detection',
      status: 'passed',
      detail: 'Payload not detected by VirusTotal (0/70 vendors)',
      risk: 'low'
    },
    {
      name: 'EDR Evasion',
      status: 'passed',
      detail: 'Bypasses CrowdStrike, SentinelOne, Defender',
      risk: 'low'
    },
    {
      name: 'Memory Footprint',
      status: 'warning',
      detail: 'Detectable by advanced memory forensics',
      risk: 'medium'
    },
    {
      name: 'Network IOCs',
      status: 'failed',
      detail: 'C2 domain flagged in passive DNS',
      risk: 'high'
    },
    {
      name: 'Behavioral Indicators',
      status: 'passed',
      detail: 'No suspicious process chains detected',
      risk: 'low'
    },
    {
      name: 'File Entropy',
      status: 'passed',
      detail: 'Properly obfuscated and encoded',
      risk: 'low'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="OPSEC Scoring"
        description="Validate payloads against known detection methods before deployment"
        actions={
          <Button
            className={team === 'blue' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-red-600 hover:bg-red-700'}
            onClick={() => toast.info('Scan Payload – integrate with payload analysis API')}
          >
            <Upload className="w-4 h-4 mr-2" />
            Scan Payload
          </Button>
        }
      />

      {/* Overall Score */}
      <Card className={cn('bg-transparent backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/20' : 'border-red-500/20')}>
        <CardHeader>
          <CardTitle className="text-white">Payload Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ScoreIndicator score={payloadScore} team={team} />
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{checks.filter(c => c.status === 'passed').length}</p>
              <p className="text-xs text-slate-400 mt-1">Checks Passed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{checks.filter(c => c.status === 'warning').length}</p>
              <p className="text-xs text-slate-400 mt-1">Warnings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{checks.filter(c => c.status === 'failed').length}</p>
              <p className="text-xs text-slate-400 mt-1">Failed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Checks */}
      <Card className={cn('bg-transparent backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/20' : 'border-red-500/20')}>
        <CardHeader>
          <CardTitle className="text-white">Detection Checks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {checks.map((check, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-black/50 rounded border border-slate-700">
              <div>
                {check.status === 'passed' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                {check.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />}
                {check.status === 'failed' && <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{check.name}</p>
                <p className="text-xs text-slate-400 mt-1">{check.detail}</p>
              </div>
              <Badge className={cn('text-xs', 
                check.risk === 'low' ? 'bg-emerald-500/20 text-emerald-400' :
                check.risk === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              )}>
                {check.risk}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className={cn('bg-transparent backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/20' : 'border-red-500/20')}>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-200">
            ⚠️ Change C2 domain to unhashed/newly registered domain
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-amber-200">
            ⚠️ Add additional obfuscation layer for memory-based detection
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-200">
            ✓ Payload is safe for deployment after addressing above
          </div>
        </CardContent>
      </Card>
    </div>
  );
}