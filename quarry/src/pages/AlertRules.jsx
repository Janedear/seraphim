import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Plus, Trash2, Mail, MessageSquare, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from "@/lib/monitoring";

export default function AlertRules() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    condition: 'critical_incident_count',
    threshold: '',
    channels: ['in_app'],
    enabled: true,
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['alert-rules'],
    queryFn: async () => {
      try {
        const result = await api.functions.invoke('getAlertRules', {});
        return result?.data ?? result ?? [];
      } catch (err) {
        logger.warn('getAlertRules failed:', err);
        return [];
      }
    },
  });

  const createRule = useMutation({
    mutationFn: async (rule) => {
      const result = await api.functions.invoke('createAlertRule', rule);
      return result?.data ?? result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alert-rules']);
      toast.success('Alert rule created successfully!');
      setOpen(false);
      setNewRule({ name: '', condition: 'critical_incident_count', threshold: '', channels: ['in_app'], enabled: true });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (ruleId) => {
      const result = await api.functions.invoke('deleteAlertRule', { ruleId });
      return result?.data ?? result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alert-rules']);
      toast.success('Alert rule deleted');
    },
  });

  const toggleRule = useMutation({
    mutationFn: async ({ ruleId, enabled }) => {
      const result = await api.functions.invoke('toggleAlertRule', { ruleId, enabled });
      return result?.data ?? result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alert-rules']);
    },
  });

  const conditionOptions = [
    { value: 'critical_incident_count', label: 'Critical Incidents Threshold' },
    { value: 'high_severity_alerts', label: 'High Severity Alerts' },
    { value: 'malware_detected', label: 'Malware Detection' },
    { value: 'unusual_network_activity', label: 'Unusual Network Activity' },
    { value: 'failed_login_attempts', label: 'Failed Login Attempts' },
    { value: 'data_exfiltration', label: 'Potential Data Exfiltration' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alert Rules"
        description="Configure custom alerting rules for critical security events"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50">
                <Plus className="w-4 h-4 mr-2" />
                New Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-black border-cyan-500/50 text-white">
              <DialogHeader>
                <DialogTitle className="text-cyan-300">Create Alert Rule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300">Rule Name</Label>
                  <Input
                    placeholder="Critical incident alert"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    className="bg-black/60 border-cyan-500/30 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Condition</Label>
                  <Select value={newRule.condition} onValueChange={(v) => setNewRule({ ...newRule, condition: v })}>
                    <SelectTrigger className="bg-black/60 border-cyan-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-cyan-500/30">
                      {conditionOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Threshold</Label>
                  <Input
                    type="number"
                    placeholder="5"
                    value={newRule.threshold}
                    onChange={(e) => setNewRule({ ...newRule, threshold: e.target.value })}
                    className="bg-black/60 border-cyan-500/30 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 mb-2 block">Notification Channels</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newRule.channels.includes('in_app')}
                        onCheckedChange={(checked) => {
                          const channels = checked
                            ? [...newRule.channels, 'in_app']
                            : newRule.channels.filter(c => c !== 'in_app');
                          setNewRule({ ...newRule, channels });
                        }}
                      />
                      <Bell className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm text-slate-300">In-App Notification</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newRule.channels.includes('email')}
                        onCheckedChange={(checked) => {
                          const channels = checked
                            ? [...newRule.channels, 'email']
                            : newRule.channels.filter(c => c !== 'email');
                          setNewRule({ ...newRule, channels });
                        }}
                      />
                      <Mail className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm text-slate-300">Email</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newRule.channels.includes('slack')}
                        onCheckedChange={(checked) => {
                          const channels = checked
                            ? [...newRule.channels, 'slack']
                            : newRule.channels.filter(c => c !== 'slack');
                          setNewRule({ ...newRule, channels });
                        }}
                      />
                      <MessageSquare className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm text-slate-300">Slack</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => createRule.mutate(newRule)}
                  className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50"
                >
                  Create Rule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="space-y-4">
        {rules.map((rule) => (
          <Card key={rule.id} className="bg-black/40 backdrop-blur-md border-cyan-500/50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-lg border flex items-center justify-center",
                    rule.enabled
                      ? "bg-cyan-500/20 border-cyan-500/50"
                      : "bg-slate-800 border-slate-700"
                  )}>
                    <AlertTriangle className={cn(
                      "w-5 h-5",
                      rule.enabled ? "text-cyan-400" : "text-slate-500"
                    )} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-semibold">{rule.name}</h4>
                      {rule.enabled ? (
                        <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/50">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500">Disabled</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {conditionOptions.find(o => o.value === rule.condition)?.label} ≥ {rule.threshold}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {rule.channels.includes('in_app') && <Bell className="w-3 h-3 text-cyan-400" />}
                      {rule.channels.includes('email') && <Mail className="w-3 h-3 text-cyan-400" />}
                      {rule.channels.includes('slack') && <MessageSquare className="w-3 h-3 text-cyan-400" />}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(checked) => toggleRule.mutate({ ruleId: rule.id, enabled: checked })}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteRule.mutate(rule.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}