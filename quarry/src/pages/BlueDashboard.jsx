import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import {
  Shield,
  Monitor,
  AlertTriangle,
  FileWarning,
  TrendingUp,
  CheckCircle2,
  Activity,
  Target } from
"lucide-react";
import { useExecutiveSummary } from '@/components/hooks/useApi';
import { Skeleton } from "@/components/ui/skeleton";
import { useWidgetManager } from '@/components/dashboard/useWidgetManager';
import DashboardCustomizer from '@/components/dashboard/DashboardCustomizer';
import DraggableWidget from '@/components/dashboard/DraggableWidget';
import { useAgentCustomization } from '@/components/hooks/useAgentCustomization';
import { useAuth } from '@/lib/AuthContext';

const StatCard = ({ icon: Icon, title, value, subtitle, trend, color }) =>
<Card className="bg-transparent backdrop-blur-md border-cyan-500/25 shadow-[0_0_20px_rgba(0,186,255,0.1)] hover:shadow-[0_0_40px_rgba(0,186,255,0.15)] transition-all group">
    <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] sm:text-[10px] text-cyan-300 mb-1.5 sm:mb-2.5 font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em]">{title}</p>
          <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tighter leading-none mb-1 sm:mb-2 drop-shadow-[0_0_20px_rgba(0,186,255,0.6)]">{value}</p>
          {subtitle &&
        <p className="text-[10px] sm:text-xs text-slate-300 font-medium">{subtitle}</p>
        }
          {trend &&
        <div className="flex items-center gap-1 sm:gap-1.5 mt-2 sm:mt-3">
              <TrendingUp className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${trend > 0 ? 'text-cyan-400' : 'text-red-400'}`} />
              <span className={`text-[10px] sm:text-xs font-semibold ${trend > 0 ? 'text-cyan-300' : 'text-red-300'}`}>
                {trend > 0 ? '+' : ''}{trend}% vs. prior
              </span>
            </div>
        }
        </div>
        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(0,186,255,0.4)] group-hover:scale-105 transition-transform flex-shrink-0">
          <Icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-cyan-400 drop-shadow-[0_0_15px_rgba(0,186,255,1)]" />
        </div>
      </div>
    </CardContent>
  </Card>;


const AVAILABLE_WIDGETS = [
{ id: 'stats', name: 'Key Metrics', description: 'Asset coverage, threats, incidents, defense index', icon: Monitor },
{ id: 'mission', name: 'Mission Protocol', description: 'Team mission statement and objectives', icon: Shield },
{ id: 'detection', name: 'Detection Systems', description: 'Real-time system status monitoring', icon: Activity },
{ id: 'methods', name: 'Detection Methods', description: 'Top detection method breakdown', icon: Target },
{ id: 'actions', name: 'Quick Actions', description: 'Rapid access to critical tools', icon: AlertTriangle }];


export default function BlueDashboard() {
  const { data: summary, isLoading } = useExecutiveSummary();
  const { user } = useAuth();
  const { customization, loading: custLoading } = useAgentCustomization(user?.email);

  // Determine active widgets from customization or default
  const defaultWidgets = ['mission', 'stats', 'detection', 'methods', 'actions'];
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
    DroppableWrapper
  } = useWidgetManager('blueDashboardWidgets', customWidgetIds);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Blue Team Dashboard" description="Defensive security operations center" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 sm:h-32" />)}
        </div>
      </div>);

  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="DEFENSIVE OPERATIONS"
        description="Elite threat detection and rapid response infrastructure"
        actions={
        <DashboardCustomizer
          availableWidgets={AVAILABLE_WIDGETS}
          activeWidgets={activeWidgets}
          onToggleWidget={toggleWidget}
          team="blue" />

        } />


      <DroppableWrapper>
        {activeWidgets.map((widgetId, index) => {
          const widget = AVAILABLE_WIDGETS.find((w) => w.id === widgetId);
          if (!widget) return null;

          return (
            <DraggableWidget
              key={widgetId}
              widget={widget}
              index={index}
              onRemove={removeWidget}
              team="blue">

                {widgetId === 'mission' &&
              <Card className="border-cyan-500/25 bg-transparent backdrop-blur-md shadow-[0_0_20px_rgba(0,186,255,0.1)]">
                    <CardContent className="pt-4">
                      <div className="flex flex-col sm:flex-row items-start gap-3">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(0,186,255,0.4)]">
                          <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400 drop-shadow-[0_0_10px_rgba(0,186,255,0.8)]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-cyan-300 text-[10px] sm:text-xs mb-1.5 sm:mb-2 tracking-[0.2em] sm:tracking-[0.25em] uppercase">Mission Protocol</p>
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-light">
                            Continuous vigilance across all attack surfaces. Real-time threat intelligence, 
                            autonomous response systems, and predictive defense mechanisms ensure absolute 
                            protection of critical infrastructure.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              }

                {widgetId === 'stats' &&
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
                  icon={Monitor}
                  title="Asset Coverage"
                  value={summary?.totalDevices || '0'}
                  subtitle={`${summary?.onlineDevices || 0} nodes active`}
                  trend={5}
                  color="bg-blue-600" />

        <StatCard
                  icon={AlertTriangle}
                  title="Threat Signals"
                  value={summary?.activeAlerts || '0'}
                  subtitle={`${summary?.criticalAlerts || 0} priority escalations`}
                  trend={-12}
                  color="bg-amber-600" />

        <StatCard
                  icon={FileWarning}
                  title="Active Incidents"
                  value={summary?.openIncidents || '0'}
                  subtitle={`${summary?.resolvedIncidents || 0} neutralized today`}
                  color="bg-red-600" />

        <StatCard
                  icon={CheckCircle2}
                  title="Defense Index"
                  value={`${summary?.protectedPercentage || 0}%`}
                  subtitle="Infrastructure integrity"
                  trend={3}
                  color="bg-emerald-600" />

                  </div>
              }

                {widgetId === 'detection' &&
              <Card className="bg-transparent backdrop-blur-md border-cyan-500/25 shadow-[0_0_20px_rgba(0,186,255,0.1)]">
                    <CardHeader>
                      <CardTitle className="text-sm text-cyan-300 font-bold tracking-[0.15em] uppercase">Detection Systems</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between py-3 border-b border-cyan-500/30">
                        <div className="flex items-center gap-3">
                          <Activity className="w-5 h-5 text-cyan-400 animate-pulse drop-shadow-[0_0_10px_rgba(0,186,255,0.8)]" />
                          <span className="text-sm text-slate-100 font-semibold">Neural Threat Engine</span>
                        </div>
                        <span className="text-[10px] font-bold text-cyan-300 px-3 py-1 bg-cyan-500/20 rounded-full border border-cyan-500/50 tracking-wider shadow-[0_0_15px_rgba(0,186,255,0.3)]">ACTIVE</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-cyan-500/30">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                          <span className="text-sm text-slate-200">SIEM Analytics</span>
                        </div>
                        <span className="text-xs font-medium text-cyan-300 px-2 py-1 bg-cyan-500/20 rounded">Running</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-cyan-500/30">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                          <span className="text-sm text-slate-200">Threat Hunting</span>
                        </div>
                        <span className="text-xs font-medium text-cyan-300 px-2 py-1 bg-cyan-500/20 rounded">Active</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                          <span className="text-sm text-slate-200">AI Detection Engine</span>
                        </div>
                        <span className="text-xs font-medium text-cyan-300 px-2 py-1 bg-cyan-500/20 rounded">Online</span>
                      </div>
                    </CardContent>
                  </Card>
              }

                {widgetId === 'methods' &&
              <Card className="bg-transparent backdrop-blur-md border-cyan-500/25 shadow-[0_0_20px_rgba(0,186,255,0.1)]">
                    <CardHeader>
                      <CardTitle className="text-sm text-cyan-300 font-bold tracking-[0.15em] uppercase">Top Detection Methods</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between py-3 border-b border-cyan-500/30">
                        <span className="text-sm text-slate-100 font-medium">Behavioral Analysis</span>
                        <span className="text-base font-bold text-cyan-300">42%</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-cyan-500/30">
                        <span className="text-sm text-slate-200">Signature Matching</span>
                        <span className="text-sm font-medium text-cyan-300">28%</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-cyan-500/30">
                        <span className="text-sm text-slate-200">ML/AI Detection</span>
                        <span className="text-sm font-medium text-cyan-300">18%</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-slate-200">YARA Rules</span>
                        <span className="text-sm font-medium text-cyan-300">12%</span>
                      </div>
                    </CardContent>
                  </Card>
              }

                {widgetId === 'actions' &&
              <Card className="bg-transparent backdrop-blur-md border-cyan-500/25 shadow-[0_0_20px_rgba(0,186,255,0.1)]">
        <CardHeader>
          <CardTitle className="text-sm text-cyan-300 font-bold tracking-[0.15em] uppercase">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <Link to={createPageUrl('Alerts')} className="p-3 sm:p-4 border border-blue-400/30 rounded-xl hover:bg-blue-500/20 hover:border-blue-400/50 transition-all group backdrop-blur-sm">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 mb-2 sm:mb-3 group-hover:scale-110 transition-transform drop-shadow-lg" />
              <p className="text-xs sm:text-sm font-bold text-white tracking-tight">Threat Intelligence</p>
              <p className="text-[10px] sm:text-xs text-slate-300 font-medium">Real-time analysis</p>
            </Link>
            <Link to={createPageUrl('ThreatHunting')} className="p-3 border border-blue-900/30 rounded-lg hover:bg-blue-950/30 hover:border-blue-500/50 transition-all group">
              <Target className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-white">Threat Hunt</p>
              <p className="text-xs text-slate-400">Proactive search</p>
            </Link>
            <Link to={createPageUrl('SIEM')} className="p-3 border border-blue-900/30 rounded-lg hover:bg-blue-950/30 hover:border-blue-500/50 transition-all group">
              <Activity className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-white">SIEM Logs</p>
              <p className="text-xs text-slate-400">Log analysis</p>
            </Link>
            <Link to={createPageUrl('Incidents')} className="p-3 border border-blue-900/30 rounded-lg hover:bg-blue-950/30 hover:border-blue-500/50 transition-all group">
              <FileWarning className="w-5 h-5 text-red-400 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-white">Incidents</p>
              <p className="text-xs text-slate-400">Response</p>
            </Link>
          </div>
                    </CardContent>
                  </Card>
              }
            </DraggableWidget>);

        })}
      </DroppableWrapper>
    </div>);

}