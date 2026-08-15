import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { AlertTriangle, CheckCircle2, Clock, Users, BookOpen } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

const PlaybookCard = ({ playbook, onView }) => (
  <Card className="bg-transparent backdrop-blur-md border border-cyan-500/20">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div>
          <CardTitle className="text-white">{playbook.name}</CardTitle>
          <p className="text-xs text-cyan-200/70 mt-1">{playbook.type}</p>
        </div>
        <Badge className="bg-cyan-500/20 text-cyan-400">{playbook.severity}</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="text-xs text-slate-400 space-y-2">
        <p><strong>Trigger:</strong> {playbook.trigger}</p>
        <p><strong>Steps:</strong> {playbook.steps} steps</p>
      </div>
      <Button size="sm" className="w-full bg-cyan-600 hover:bg-cyan-700" onClick={() => onView?.(playbook)}>
        <BookOpen className="w-3 h-3 mr-2" />
        View Playbook
      </Button>
    </CardContent>
  </Card>
);

export default function IncidentPlaybooks() {
  const { user } = useAuth();
  const [activePhase, setActivePhase] = useState('preparation');

  const playbooks = [
    {
      id: 1,
      name: 'Ransomware Response',
      type: 'Incident Response',
      severity: 'Critical',
      trigger: 'Ransomware encryption detected',
      steps: 8,
      phase: 'response'
    },
    {
      id: 2,
      name: 'Data Breach Investigation',
      type: 'Forensics',
      severity: 'High',
      trigger: 'Unauthorized data access',
      steps: 12,
      phase: 'investigation'
    },
    {
      id: 3,
      name: 'Insider Threat Assessment',
      type: 'Threat Hunting',
      severity: 'High',
      trigger: 'Suspicious user behavior',
      steps: 9,
      phase: 'investigation'
    }
  ];

  const phases = [
    { id: 'preparation', name: 'Preparation', icon: Users },
    { id: 'response', name: 'Response', icon: AlertTriangle },
    { id: 'investigation', name: 'Investigation', icon: Clock },
    { id: 'recovery', name: 'Recovery', icon: CheckCircle2 }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incident Response Playbooks"
        description="Pre-built runbooks for common security incidents"
      />

      {/* Phase Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {phases.map(phase => {
          const Icon = phase.icon;
          return (
            <Button
              key={phase.id}
              variant={activePhase === phase.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePhase(phase.id)}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Icon className="w-4 h-4" />
              {phase.name}
            </Button>
          );
        })}
      </div>

      {/* Playbooks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {playbooks
          .filter(p => activePhase === 'preparation' || p.phase === activePhase)
          .map(playbook => (
            <PlaybookCard
              key={playbook.id}
              playbook={playbook}
              onView={(p) => toast.info(`${p.name} – integrate with playbook execution engine for full workflow`)}
            />
          ))}
      </div>

      {/* Playbook Workflow */}
      <Card className="bg-transparent backdrop-blur-md border border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-white">Standard Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { step: 1, action: 'Detect & Alert', time: 'Minutes' },
              { step: 2, action: 'Assess & Scope', time: '15-30 min' },
              { step: 3, action: 'Contain & Isolate', time: '1-2 hours' },
              { step: 4, action: 'Investigate & Analyze', time: 'Hours/Days' },
              { step: 5, action: 'Remediate & Recover', time: 'Variable' },
              { step: 6, action: 'Review & Document', time: '1-2 weeks' }
            ].map(item => (
              <div key={item.step} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-cyan-400">{item.step}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{item.action}</p>
                  <p className="text-xs text-slate-400">~{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}