import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { Clock, Users, Target, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

const TemplateCard = ({ template, team }) => (
  <Card className={cn('bg-transparent backdrop-blur-md border hover:shadow-lg transition-all', team === 'blue' ? 'border-cyan-500/20' : 'border-red-500/20')}>
    <CardHeader>
      <div className="flex items-start justify-between">
        <div>
          <CardTitle className="text-white">{template.name}</CardTitle>
          <CardDescription className={team === 'blue' ? 'text-cyan-200/70' : 'text-red-200/70'}>{template.description}</CardDescription>
        </div>
        <Badge className="text-xs">{template.difficulty}</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Clock className="w-3 h-3" />
          <span>{template.duration}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Users className="w-3 h-3" />
          <span>{template.team} people</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Target className="w-3 h-3" />
          <span>{template.targets}</span>
        </div>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{template.summary}</p>
      <Button size="sm" className={team === 'blue' ? 'w-full bg-cyan-600 hover:bg-cyan-700' : 'w-full bg-red-600 hover:bg-red-700'}>
        <Play className="w-3 h-3 mr-2" />
        Launch Assessment
      </Button>
    </CardContent>
  </Card>
);

export default function AssessmentTemplates() {
  const { user } = useAuth();
  const team = user?.team || 'blue';

  const templates = team === 'red' ? [
    {
      id: 1,
      name: 'Web Application Pentest',
      description: 'Comprehensive web app security assessment',
      difficulty: 'Intermediate',
      duration: '2 weeks',
      team: 3,
      targets: 'Web Apps',
      summary: 'Full OWASP Top 10 assessment including authentication, injection, XSS, CSRF, and API security testing.'
    },
    {
      id: 2,
      name: 'Network Infrastructure Assessment',
      description: 'Internal network security evaluation',
      difficulty: 'Advanced',
      duration: '3 weeks',
      team: 4,
      targets: 'Network',
      summary: 'Reconnaissance, exploitation, lateral movement, and persistence testing across network infrastructure.'
    },
    {
      id: 3,
      name: 'Phishing Campaign',
      description: 'Social engineering assessment',
      difficulty: 'Beginner',
      duration: '1 week',
      team: 2,
      targets: 'Users',
      summary: 'Targeted phishing campaign with credential harvesting, attachment delivery, and user awareness metrics.'
    }
  ] : [
    {
      id: 1,
      name: 'Security Baseline Assessment',
      description: 'Establish security posture baseline',
      difficulty: 'Beginner',
      duration: '1 week',
      team: 2,
      targets: 'Infrastructure',
      summary: 'Device inventory, patch management, security software deployment, and configuration compliance baseline.'
    },
    {
      id: 2,
      name: 'Incident Response Tabletop',
      description: 'Test incident response procedures',
      difficulty: 'Intermediate',
      duration: '2 days',
      team: 5,
      targets: 'IR Team',
      summary: 'Simulated breach scenario to validate detection, communication, containment, and recovery procedures.'
    },
    {
      id: 3,
      name: 'Compliance Assessment',
      description: 'PCI-DSS or SOC2 compliance validation',
      difficulty: 'Advanced',
      duration: '4 weeks',
      team: 6,
      targets: 'All Systems',
      summary: 'Comprehensive control verification, documentation review, and compliance gap remediation planning.'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessment Templates"
        description={team === 'red' ? 'Pre-built offensive security assessment frameworks' : 'Pre-built defensive assessment frameworks'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {templates.map(template => (
          <TemplateCard key={template.id} template={template} team={team} />
        ))}
      </div>

      {/* Quick Start Guide */}
      <Card className={cn('bg-black/40 backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/30' : 'border-red-500/30')}>
        <CardHeader>
          <CardTitle className="text-white">How to Use Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <span className="font-bold text-white min-w-fit">1.</span>
            <p className="text-slate-300">Select a template matching your assessment scope</p>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-white min-w-fit">2.</span>
            <p className="text-slate-300">Customize timeline, team members, and target scope</p>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-white min-w-fit">3.</span>
            <p className="text-slate-300">Assign tools, payloads, and detection rules automatically</p>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-white min-w-fit">4.</span>
            <p className="text-slate-300">Track progress and generate reports</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}