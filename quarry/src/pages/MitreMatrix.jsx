import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

const tactics = [
  'Reconnaissance',
  'Resource Development',
  'Initial Access',
  'Execution',
  'Persistence',
  'Privilege Escalation',
  'Defense Evasion',
  'Credential Access',
  'Discovery',
  'Lateral Movement',
  'Collection',
  'Command & Control',
  'Exfiltration',
  'Impact'
];

const techniques = {
  'Reconnaissance': ['T1592 - Gather Victim Host Info', 'T1589 - Gather Victim Identity Info'],
  'Execution': ['T1059 - Command & Scripting', 'T1203 - Exploitation for Client Execution'],
  'Persistence': ['T1547 - Boot or Logon Autostart', 'T1547.001 - Registry Run Keys'],
  'Privilege Escalation': ['T1134 - Access Token Manipulation', 'T1548 - Abuse Elevation Control'],
  'Defense Evasion': ['T1548 - Abuse Elevation Control', 'T1140 - Deobfuscate/Decode Files'],
  'Command & Control': ['T1071 - Application Layer Protocol', 'T1092 - Communication Through Removable Media']
};

export default function MitreMatrix() {
  const { user } = useAuth();
  const team = user?.team || 'blue';
  const [selectedTactic, setSelectedTactic] = useState('Execution');
  const [coverage] = useState({
    'Reconnaissance': 45,
    'Execution': 78,
    'Persistence': 62,
    'Defense Evasion': 85,
    'Command & Control': 70
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="MITRE ATT&CK Coverage"
        description="Visual mapping of techniques your payloads & operations cover"
      />

      {/* Coverage Heatmap */}
      <Card className={cn('bg-transparent backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/20' : 'border-red-500/20')}>
        <CardHeader>
          <CardTitle className="text-white">Coverage Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {tactics.map(tactic => {
              const cov = coverage[tactic] || 0;
              const bgColor = cov >= 70 ? 'bg-red-500' : cov >= 40 ? 'bg-amber-500' : 'bg-slate-700';
              return (
                <button
                  key={tactic}
                  onClick={() => setSelectedTactic(tactic)}
                  className={cn('p-2 sm:p-3 rounded border transition-all text-center', 
                    selectedTactic === tactic ? 'border-white' : 'border-slate-700',
                    bgColor
                  )}>
                  <p className="text-[10px] sm:text-xs font-bold text-white truncate">{tactic.split(' ')[0]}</p>
                  <p className="text-lg sm:text-xl font-bold text-white mt-0.5 sm:mt-1">{cov}%</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Technique Details */}
      <Card className={cn('bg-transparent backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/20' : 'border-red-500/20')}>
        <CardHeader>
          <CardTitle className="text-white">{selectedTactic} Techniques</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(techniques[selectedTactic] || []).map((tech, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-black/50 rounded border border-slate-700">
              <span className="text-sm text-slate-200">{tech}</span>
              <Badge className={team === 'blue' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-500/20 text-red-400'}>
                Covered
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className={cn('bg-transparent backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/20' : 'border-red-500/20')}>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-white">34</p>
            <p className={cn('text-xs mt-1', team === 'blue' ? 'text-cyan-200/70' : 'text-red-200/70')}>Tactics Covered</p>
          </CardContent>
        </Card>
        <Card className={cn('bg-transparent backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/20' : 'border-red-500/20')}>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-white">142</p>
            <p className={cn('text-xs mt-1', team === 'blue' ? 'text-cyan-200/70' : 'text-red-200/70')}>Techniques Mapped</p>
          </CardContent>
        </Card>
        <Card className={cn('bg-transparent backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/20' : 'border-red-500/20')}>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-white">68%</p>
            <p className={cn('text-xs mt-1', team === 'blue' ? 'text-cyan-200/70' : 'text-red-200/70')}>Overall Coverage</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}