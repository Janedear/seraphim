import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { 
  Target, 
  Terminal, 
  Mail, 
  Shield,
  Zap,
  Lock,
  Activity
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWidgetManager } from '@/components/dashboard/useWidgetManager';
import DashboardCustomizer from '@/components/dashboard/DashboardCustomizer';
import DraggableWidget from '@/components/dashboard/DraggableWidget';
import { useAgentCustomization } from '@/components/hooks/useAgentCustomization';
import { useAuth } from '@/lib/AuthContext';

const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
  <Card className="bg-transparent backdrop-blur-md border-red-500/20 shadow-[0_0_20px_rgba(255,50,50,0.06)] hover:shadow-[0_0_40px_rgba(255,50,50,0.1)] transition-all group">
    <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] sm:text-[10px] text-red-300 mb-1.5 sm:mb-2.5 font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em]">{title}</p>
          <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tighter leading-none mb-1 sm:mb-2 drop-shadow-[0_0_20px_rgba(255,50,50,0.6)]">{value}</p>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-slate-300 font-medium">{subtitle}</p>
          )}
        </div>
        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(255,50,50,0.4)] group-hover:scale-105 transition-transform flex-shrink-0">
          <Icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-red-400 drop-shadow-[0_0_15px_rgba(255,50,50,1)]" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const AVAILABLE_WIDGETS = [
  { id: 'stats', name: 'Key Metrics', description: 'Engagement cycles, social engineering, attack vectors', icon: Target },
  { id: 'mission', name: 'Engagement Protocol', description: 'Team mission statement and objectives', icon: Target },
  { id: 'operations', name: 'Active Operations', description: 'Current campaign status monitoring', icon: Activity },
  { id: 'coverage', name: 'Testing Coverage', description: 'Security testing progress breakdown', icon: Shield },
  { id: 'actions', name: 'Quick Actions', description: 'Rapid access to offensive tools', icon: Terminal },
  { id: 'findings', name: 'Recent Findings', description: 'Latest vulnerabilities and discoveries', icon: Mail },
];

export default function RedDashboard() {
  const { user } = useAuth();
  const { customization, loading: custLoading } = useAgentCustomization(user?.email);

  // Determine active widgets from customization or default
  const defaultWidgets = ['mission', 'stats', 'operations', 'coverage', 'actions', 'findings'];
  const customWidgetIds = useMemo(() => {
    if (customization?.dashboard_layout?.length > 0) {
      return customization.dashboard_layout
        .sort((a, b) => a.position - b.position)
        .filter(w => w.visible)
        .map(w => w.widget_id)
        .filter(id => AVAILABLE_WIDGETS.some(aw => aw.id === id));
    }
    return defaultWidgets;
  }, [customization?.dashboard_layout]);

  const {
    activeWidgets,
    toggleWidget,
    removeWidget,
    DroppableWrapper,
  } = useWidgetManager('redDashboardWidgets', customWidgetIds);

  if (custLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Red Team Dashboard" description="Offensive security operations" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 sm:h-32 bg-slate-800" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="OFFENSIVE OPERATIONS"
        description="Advanced threat simulation and adversarial testing framework"
        actions={
          <DashboardCustomizer
            availableWidgets={AVAILABLE_WIDGETS}
            activeWidgets={activeWidgets}
            onToggleWidget={toggleWidget}
            team="red"
          />
        }
      />

      <DroppableWrapper>
        {activeWidgets.map((widgetId, index) => {
          const widget = AVAILABLE_WIDGETS.find(w => w.id === widgetId);
          if (!widget) return null;

          return (
            <DraggableWidget
              key={widgetId}
              widget={widget}
              index={index}
              onRemove={removeWidget}
              team="red"
            >
                {widgetId === 'mission' && (
                   <Card className="border-red-500/20 bg-transparent backdrop-blur-md shadow-[0_0_20px_rgba(255,50,50,0.06)]">
                    <CardContent className="pt-6 pb-6">
                      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(255,50,50,0.4)] flex-shrink-0">
                          <Target className="w-6 h-6 sm:w-7 sm:h-7 text-red-400 drop-shadow-[0_0_10px_rgba(255,50,50,0.8)]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-red-300 text-[10px] sm:text-xs mb-1.5 sm:mb-2 tracking-[0.2em] sm:tracking-[0.25em] uppercase">Engagement Protocol</p>
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-light">
                            Precision adversary emulation across the full attack lifecycle. Advanced persistent 
                            threat modeling, zero-day exploitation research, and continuous validation of defensive 
                            posture through tactical engagement.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {widgetId === 'stats' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Target}
          title="Engagement Cycles"
          value="156"
          subtitle="23 operations this cycle"
          color="bg-red-600"
        />
        <StatCard
          icon={Mail}
          title="Social Engineering"
          value="12"
          subtitle="3 campaigns running"
          color="bg-orange-600"
        />
        <StatCard
          icon={Shield}
          title="Attack Vectors"
          value="47"
          subtitle="8 zero-day candidates"
          color="bg-amber-600"
        />
        <StatCard
          icon={Zap}
          title="Detection Evasion"
          value="94%"
          subtitle="Bypass success rate"
          color="bg-purple-600"
        />
                  </div>
                )}

                {widgetId === 'operations' && (
                <Card className="bg-black/5 backdrop-blur-md border-red-500/15 shadow-[0_0_25px_rgba(255,50,50,0.08)]">
          <CardHeader>
            <CardTitle className="text-sm text-red-300 font-bold tracking-[0.15em] uppercase">Active Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-red-400/10">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse drop-shadow-lg" />
                <span className="text-sm text-slate-200 font-medium">Phishing Campaign #12</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-300 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-400/30 tracking-wider">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-red-400/10">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-amber-400 drop-shadow-lg" />
                <span className="text-sm text-slate-200 font-medium">Ransomware Simulation</span>
              </div>
              <span className="text-[10px] font-bold text-amber-300 px-3 py-1 bg-amber-500/20 rounded-full border border-amber-400/30 tracking-wider">SCHEDULED</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-red-400/10">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse drop-shadow-lg" />
                <span className="text-sm text-slate-200 font-medium">Web App Pentest</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-300 px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-400/30 tracking-wider">RUNNING</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-400 font-medium">APT Scenario</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 px-3 py-1 bg-slate-700/20 rounded-full border border-slate-600/30 tracking-wider">PLANNED</span>
            </div>
          </CardContent>
                  </Card>
                )}

                {widgetId === 'coverage' && (
                   <Card className="bg-black/5 backdrop-blur-md border-red-500/15 shadow-[0_0_25px_rgba(255,50,50,0.08)]">
          <CardHeader>
            <CardTitle className="text-sm text-red-300 font-bold tracking-[0.15em] uppercase">Testing Coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-200 font-medium">Social Engineering</span>
                <span className="font-bold text-red-300">87%</span>
              </div>
              <div className="h-2.5 bg-slate-950/60 rounded-full overflow-hidden backdrop-blur-sm">
                <div className="h-full bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-900/50" style={{ width: '87%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Network Attacks</span>
                <span className="font-medium text-red-400">72%</span>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg shadow-orange-900/50" style={{ width: '72%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Application Security</span>
                <span className="font-medium text-red-400">91%</span>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-600 to-purple-500 shadow-lg shadow-purple-900/50" style={{ width: '91%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Physical Security</span>
                <span className="font-medium text-red-400">45%</span>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-600 to-amber-500 shadow-lg shadow-amber-900/50" style={{ width: '45%' }} />
              </div>
            </div>
          </CardContent>
                  </Card>
                )}

                {widgetId === 'actions' && (
                   <Card className="bg-black/5 backdrop-blur-md border-red-500/15 shadow-[0_0_25px_rgba(255,50,50,0.08)]">
        <CardHeader>
          <CardTitle className="text-sm text-red-300 font-bold tracking-[0.15em] uppercase">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <Link to={createPageUrl('AttackSimulations')} className="p-4 border border-red-400/20 rounded-xl hover:bg-red-500/20 hover:border-red-400/40 transition-all group backdrop-blur-sm">
              <Target className="w-6 h-6 text-red-400 mb-3 group-hover:scale-110 transition-transform drop-shadow-lg" />
              <p className="text-sm font-bold text-white tracking-tight">Simulation</p>
              <p className="text-xs text-slate-300 font-medium">Launch attack</p>
            </Link>
            <Link to={createPageUrl('PhishingCampaigns')} className="p-3 border border-red-900/30 rounded-lg hover:bg-red-950/30 hover:border-red-500/50 transition-all group">
              <Mail className="w-5 h-5 text-orange-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-white">Phishing</p>
              <p className="text-xs text-slate-400">Social engineering</p>
            </Link>
            <Link to={createPageUrl('PayloadGenerator')} className="p-3 border border-red-900/30 rounded-lg hover:bg-red-950/30 hover:border-red-500/50 transition-all group">
              <Terminal className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-white">Payload Gen</p>
              <p className="text-xs text-slate-400">Offensive toolkit</p>
            </Link>
            <Link to={createPageUrl('EncodersDecoders')} className="p-3 border border-red-900/30 rounded-lg hover:bg-red-950/30 hover:border-red-500/50 transition-all group">
              <Lock className="w-5 h-5 text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-white">Encoders</p>
              <p className="text-xs text-slate-400">Data manipulation</p>
            </Link>
          </div>
                    </CardContent>
                  </Card>
                )}

                {widgetId === 'findings' && (
                   <Card className="bg-black/5 backdrop-blur-md border-red-500/15 shadow-[0_0_25px_rgba(255,50,50,0.08)]">
        <CardHeader>
          <CardTitle className="text-sm text-red-300 font-bold tracking-[0.15em] uppercase">Recent Findings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 border border-red-400/20 rounded-xl hover:bg-red-950/20 transition-colors backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-red-500/30 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg">
                <Shield className="w-5 h-5 text-red-200" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">SQL Injection vulnerability found</p>
                <p className="text-xs text-slate-300 font-medium">Web application login form - Critical severity</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border border-red-900/30 rounded-lg hover:bg-red-950/20 transition-colors">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-900/50">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Phishing campaign 67% click rate</p>
                <p className="text-xs text-slate-400">Executive team targeted - Training recommended</p>
                <p className="text-xs text-slate-500 mt-1">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border border-red-900/30 rounded-lg hover:bg-red-950/20 transition-colors">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-900/50">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Lateral movement detected in 8 minutes</p>
                <p className="text-xs text-slate-400">Blue team response time improving</p>
                <p className="text-xs text-slate-500 mt-1">1 day ago</p>
              </div>
            </div>
          </div>
                    </CardContent>
                  </Card>
                )}
            </DraggableWidget>
          );
        })}
      </DroppableWrapper>
    </div>
  );
}