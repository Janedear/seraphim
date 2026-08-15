import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { Calendar, Target, Users, Plus, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

const CampaignCard = ({ campaign, team }) => (
  <Card className={cn('bg-transparent backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/20' : 'border-red-500/20')}>
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <CardTitle className="text-white">{campaign.name}</CardTitle>
          <CardDescription className={team === 'blue' ? 'text-cyan-200/70' : 'text-red-200/70'}>{campaign.description}</CardDescription>
        </div>
        <Badge className={campaign.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : campaign.status === 'planned' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}>
          {campaign.status}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-300">
          <Calendar className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{campaign.duration}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-300">
          <Users className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{campaign.team_size} operators</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-300">
          <Target className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{campaign.targets} targets</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-300">
          <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{campaign.progress}%</span>
        </div>
      </div>
      <div className="h-2 bg-slate-900/50 rounded overflow-hidden">
        <div className={cn('h-full transition-all', team === 'blue' ? 'bg-cyan-500' : 'bg-red-500')} style={{ width: `${campaign.progress}%` }} />
      </div>
    </CardContent>
  </Card>
);

export default function CampaignManager() {
  const { user } = useAuth();
  const team = user?.team || 'blue';
  const [activeTab, setActiveTab] = useState('active');

  const campaigns = [
    {
      id: 1,
      name: 'Enterprise Pentest Q1',
      description: 'Comprehensive security assessment',
      status: 'active',
      duration: '8 weeks',
      team_size: 4,
      targets: 23,
      progress: 65,
      type: team === 'red' ? 'Offensive' : 'Defensive'
    },
    {
      id: 2,
      name: 'Red Team Exercise',
      description: 'APT Simulation',
      status: 'active',
      duration: '4 weeks',
      team_size: 6,
      targets: 45,
      progress: 40,
      type: team === 'red' ? 'Offensive' : 'Defensive'
    },
    {
      id: 3,
      name: 'Compliance Assessment',
      description: 'PCI-DSS validation',
      status: 'planned',
      duration: '6 weeks',
      team_size: 3,
      targets: 12,
      progress: 0,
      type: team === 'red' ? 'Offensive' : 'Defensive'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaign Management"
        description={team === 'red' ? 'Coordinate offensive operations' : 'Manage defensive assessments'}
        actions={
          <Button className={team === 'blue' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-red-600 hover:bg-red-700'}>
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn('bg-black/40 border', team === 'blue' ? 'border-cyan-500/30' : 'border-red-500/30')}>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="planned">Planned</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {campaigns.filter(c => c.status === 'active').map(campaign => (
              <CampaignCard key={campaign.id} campaign={campaign} team={team} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="planned" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {campaigns.filter(c => c.status === 'planned').map(campaign => (
              <CampaignCard key={campaign.id} campaign={campaign} team={team} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <Card className={cn('bg-black/40 backdrop-blur-md border text-center p-12', team === 'blue' ? 'border-cyan-500/30' : 'border-red-500/30')}>
            <p className="text-slate-400">No completed campaigns yet</p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Campaign Timeline */}
      <Card className={cn('bg-transparent backdrop-blur-md border', team === 'blue' ? 'border-cyan-500/20' : 'border-red-500/20')}>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Campaign Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 pb-4 border-b border-slate-700 last:border-0">
                <div className={cn('w-3 h-3 rounded-full mt-1.5 flex-shrink-0', team === 'blue' ? 'bg-cyan-400' : 'bg-red-400')} />
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">Milestone {i}</p>
                  <p className="text-xs text-slate-400 mt-1">Description of key event</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}