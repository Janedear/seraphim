import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Sparkles, Calendar, Download, Clock, TrendingUp, AlertTriangle, Shield } from "lucide-react";
import { toast } from "sonner";

export default function AIReports() {
  const queryClient = useQueryClient();
  const [generatingType, setGeneratingType] = useState(null);
  const [scheduleReportType, setScheduleReportType] = useState('daily-summary');
  const [scheduleFrequency, setScheduleFrequency] = useState('daily');
  const [scheduleRecipients, setScheduleRecipients] = useState('');

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['ai-reports'],
    queryFn: async () => {
      const { data } = await api.functions.invoke('getReportHistory', {});
      return data;
    },
  });

  const generateReport = useMutation({
    mutationFn: async (params) => {
      const { data } = await api.functions.invoke('generateAIReport', params);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['ai-reports']);
      toast.success('Report generated successfully!');
      setGeneratingType(null);
    },
    onError: () => {
      toast.error('Failed to generate report');
      setGeneratingType(null);
    },
  });

  const scheduleReport = useMutation({
    mutationFn: async (params) => {
      const { data } = await api.functions.invoke('scheduleReport', params);
      return data;
    },
    onSuccess: () => {
      toast.success('Report scheduled successfully!');
    },
    onError: (e) => {
      toast.error(e?.message || 'Failed to schedule report');
    },
  });

  const handleGenerateReport = (type) => {
    setGeneratingType(type);
    generateReport.mutate({ reportType: type, timeframe: 'last_7_days' });
  };

  const reportTemplates = [
    { id: 'daily-summary', name: 'Daily Security Summary', icon: Clock, description: 'Quick overview of today\'s security events', color: 'cyan' },
    { id: 'weekly-incidents', name: 'Weekly Incident Review', icon: AlertTriangle, description: 'Comprehensive analysis of weekly incidents', color: 'red' },
    { id: 'monthly-threat', name: 'Monthly Threat Landscape', icon: TrendingUp, description: 'Strategic threat intelligence and trends', color: 'cyan' },
    { id: 'compliance', name: 'Compliance Report', icon: Shield, description: 'Security posture and compliance metrics', color: 'cyan' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI-Powered Reports"
        description="Automated security reporting with AI-driven insights and analytics"
      />

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="bg-black border border-cyan-500/30">
          <TabsTrigger value="generate" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">Generate</TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">Schedule</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTemplates.map((template) => (
              <Card key={template.id} className="bg-black/40 backdrop-blur-md border-cyan-500/50 hover:shadow-[0_0_30px_rgba(0,186,255,0.3)] transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
                        <template.icon className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-base">{template.name}</CardTitle>
                        <p className="text-xs text-slate-400 mt-1">{template.description}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleGenerateReport(template.id)}
                    disabled={generatingType === template.id}
                    className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                  >
                    {generatingType === template.id ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card className="bg-black/40 backdrop-blur-md border-cyan-500/50">
            <CardHeader>
              <CardTitle className="text-cyan-300 text-sm tracking-[0.15em] uppercase">Schedule Automated Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Report Type</Label>
                  <Select value={scheduleReportType} onValueChange={setScheduleReportType}>
                    <SelectTrigger className="bg-black/60 border-cyan-500/30 text-white">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-cyan-500/30">
                      {reportTemplates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Frequency</Label>
                  <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                    <SelectTrigger className="bg-black/60 border-cyan-500/30 text-white">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-cyan-500/30">
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Recipients (Email, comma-separated)</Label>
                <Input
                  placeholder="email@example.com"
                  value={scheduleRecipients}
                  onChange={(e) => setScheduleRecipients(e.target.value)}
                  className="bg-black/60 border-cyan-500/30 text-white"
                />
              </div>
              <Button
                className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                onClick={() => scheduleReport.mutate({
                  reportType: scheduleReportType,
                  frequency: scheduleFrequency,
                  recipients: scheduleRecipients.split(',').map(e => e.trim()).filter(Boolean),
                  timeframe: 'last_7_days'
                })}
                disabled={scheduleReport.isPending}
              >
                {scheduleReport.isPending ? (
                  <>
                    <Calendar className="w-4 h-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 bg-slate-800" />)}
            </div>
          ) : reports.length === 0 ? (
            <Card className="bg-black/40 backdrop-blur-md border-cyan-500/50">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No reports generated yet</p>
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id} className="bg-black/40 backdrop-blur-md border-cyan-500/50 hover:border-cyan-500/70 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{report.name}</h4>
                        <p className="text-xs text-slate-400">{report.generated_at}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}