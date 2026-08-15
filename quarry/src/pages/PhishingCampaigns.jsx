import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Mail,
  TrendingUp,
  CheckCircle2,
  Eye,
  MousePointer,
  Send,
  Plus,
  Play,
  Pause,
  BarChart3
} from "lucide-react";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { toast } from "sonner";
import { api } from "@/api/client";

const CampaignCard = ({ campaign, onView, onToggle }) => {
  const statusColors = {
    draft: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    completed: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
    paused: 'bg-amber-500/20 text-amber-400 border-amber-500/50'
  };
  const c = statusColors[campaign.status] || statusColors.draft;

  return (
    <Card className="hover:shadow-[0_0_40px_rgba(255,50,50,0.3)] transition-all bg-black/40 backdrop-blur-md border-red-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-base text-white">{campaign.name}</CardTitle>
              <Badge className={`${c} border`}>
                {campaign.status}
              </Badge>
            </div>
            <CardDescription className="text-xs text-red-200/70">{campaign.template}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 bg-slate-900/50 rounded text-center border border-slate-700">
              <p className="text-slate-400 mb-1">Sent</p>
              <p className="font-bold text-lg text-white">{campaign.sent}</p>
            </div>
            <div className="p-2 bg-cyan-500/10 rounded text-center border border-cyan-500/30">
              <p className="text-slate-400 mb-1">Opened</p>
              <p className="font-bold text-lg text-cyan-400">{campaign.opened}</p>
            </div>
            <div className="p-2 bg-red-500/10 rounded text-center border border-red-500/30">
              <p className="text-slate-400 mb-1">Clicked</p>
              <p className="font-bold text-lg text-red-400">{campaign.clicked}</p>
            </div>
          </div>

          {campaign.status === 'active' && campaign.total > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Progress</span>
                <span className="font-medium text-slate-300">{Math.round((campaign.sent / campaign.total) * 100)}%</span>
              </div>
              <Progress value={(campaign.sent / campaign.total) * 100} className="h-2" />
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onView(campaign.id)}>
              <BarChart3 className="w-3 h-3 mr-1" />
              Results
            </Button>
            {campaign.status === 'active' && (
              <Button size="sm" variant="outline" onClick={() => onToggle(campaign.id)}>
                <Pause className="w-3 h-3" />
              </Button>
            )}
            {campaign.status === 'paused' && (
              <Button size="sm" variant="outline" onClick={() => onToggle(campaign.id)}>
                <Play className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TemplateCard = ({ template, onSelect }) => {
  const difficultyColors = {
    easy: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    medium: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    hard: 'bg-red-500/20 text-red-300 border-red-500/50'
  };

  return (
    <Card className="hover:shadow-[0_0_40px_rgba(255,50,50,0.3)] transition-all cursor-pointer bg-black/40 backdrop-blur-md border-red-500/30" onClick={() => onSelect(template)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <CardTitle className="text-base text-white">{template.name}</CardTitle>
          <Badge className={`${difficultyColors[template.difficulty]} border`}>
            {template.difficulty}
          </Badge>
        </div>
        <CardDescription className="text-xs text-red-200/70">{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Success Rate:</span>
            <span className="font-semibold">{template.successRate ?? '—'}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Avg. Click Rate:</span>
            <span className="font-semibold">{template.avgClickRate ?? '—'}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function PhishingCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configMessage, setConfigMessage] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.functions.invoke('listPhishingCampaigns', {});
        setCampaigns(data?.campaigns || []);
        setTemplates(data?.templates || []);
        setConfigMessage(data?.message);
      } catch (err) {
        toast.error('Failed to load campaigns');
        setCampaigns([]);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleViewCampaign = (id) => {
    toast.info('Campaign analytics - configure PhishingCampaign entity for full data');
  };

  const handleToggleCampaign = (id) => {
    setCampaigns(campaigns.map(c => 
      c.id === id 
        ? { ...c, status: c.status === 'active' ? 'paused' : 'active' }
        : c
    ));
    toast.success('Campaign status updated');
  };

  const handleSelectTemplate = (template) => {
    toast.success(`Selected: ${template.name}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phishing Campaign Manager"
        description="Test your team's security awareness with simulated phishing attacks"
        actions={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        }
      />

      {configMessage && (
        <Card className="border-amber-500/50 bg-amber-950/30">
          <CardContent className="pt-4">
            <p className="text-sm text-amber-200">{configMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Info Banner */}
      <Card className="border-red-500/30 bg-red-500/5 backdrop-blur-md">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(255,50,50,0.3)]">
              <Mail className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-white mb-1">What are Phishing Simulations?</p>
              <p className="text-sm text-red-100 mb-2">
                Phishing simulations are test emails sent to your employees to test their awareness. 
                When someone clicks a link or downloads an attachment, they receive immediate security training. 
                This helps identify vulnerable users and improve overall security posture.
              </p>
              <p className="text-xs text-red-200 font-medium">
                ✓ No real harm • ✓ Immediate education • ✓ Track improvements over time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(255,50,50,0.3)]">
                <Send className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{campaigns.reduce((a, c) => a + (c.sent || 0), 0)}</p>
                <p className="text-xs text-red-200/70">Emails Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Eye className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{campaigns.reduce((a, c) => a + (c.opened || 0), 0)}</p>
                <p className="text-xs text-red-200/70">Opened</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/30 border border-red-500/60 flex items-center justify-center shadow-[0_0_20px_rgba(255,50,50,0.4)]">
                <MousePointer className="w-5 h-5 text-red-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{campaigns.reduce((a, c) => a + (c.clicked || 0), 0)}</p>
                <p className="text-xs text-red-200/70">Clicked</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{campaigns.length}</p>
                <p className="text-xs text-red-200/70">Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Active Campaigns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onView={handleViewCampaign}
              onToggle={handleToggleCampaign}
            />
          ))}
        </div>
      </div>

      {/* Templates */}
      <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
        <CardHeader>
          <CardTitle className="text-white">Phishing Templates</CardTitle>
          <CardDescription className="text-red-200/70">
            Pre-built templates based on real-world phishing attacks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={handleSelectTemplate}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card className="border-red-500/30 bg-red-500/5 backdrop-blur-md">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0 drop-shadow-[0_0_10px_rgba(255,50,50,0.6)]" />
            <div>
              <p className="font-semibold text-white text-sm mb-2">Best Practices</p>
              <ul className="text-xs text-red-100 space-y-1">
                <li>• Start with easy templates and gradually increase difficulty</li>
                <li>• Run campaigns quarterly to track improvement</li>
                <li>• Provide immediate training when someone clicks</li>
                <li>• Never punish employees - use it as a learning opportunity</li>
                <li>• Track repeat offenders for additional one-on-one training</li>
                <li>• Test all departments, including executives</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}