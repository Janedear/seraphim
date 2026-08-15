import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Monitor,
  Shield,
  AlertTriangle,
  Activity,
  Clock,
  MapPin,
  User,
  Cpu,
  HardDrive,
  Network,
  RefreshCw,
  Search,
  Wifi,
  WifiOff,
  FileText,
  ChevronRight,
  ArrowLeft,
  Loader2,
  ShieldAlert
} from "lucide-react";
import { useDevice, useDeviceAlerts, useDeviceAction } from '@/components/hooks/useApi';
import { StatusBadge, SeverityBadge, OsBadge, RiskScoreBadge } from '@/components/ui-custom/StatusBadge';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
    {Icon && <Icon className="w-4 h-4 text-slate-400 mt-0.5" />}
    <div className="flex-1">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value || 'N/A'}</p>
    </div>
  </div>
);

const ActionButton = ({ icon: Icon, label, onClick, variant = 'outline', loading, disabled }) => (
  <Button 
    variant={variant} 
    size="sm" 
    onClick={onClick}
    disabled={loading || disabled}
    className="flex-1"
  >
    {loading ? (
      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
    ) : (
      <Icon className="w-4 h-4 mr-2" />
    )}
    {label}
  </Button>
);

const mapOsToDeviceType = (os) => {
  if (!os) return 'windows';
  const o = (os || '').toLowerCase();
  if (o.includes('linux') || o.includes('ubuntu') || o.includes('centos')) return 'linux';
  if (o.includes('mac') || o.includes('darwin')) return 'macos';
  return 'windows';
};

export default function DeviceDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const deviceId = urlParams.get('id');
  const { user } = useAuth();

  const { data: device, isLoading } = useDevice(deviceId);
  const { data: alerts, isLoading: alertsLoading } = useDeviceAlerts(deviceId);
  const actionMutation = useDeviceAction();

  const [activeTab, setActiveTab] = useState('overview');
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleAction = async (action) => {
    if (action === 'scan') {
      setScanLoading(true);
      setScanResult(null);
      try {
        const result = await api.functions.invoke('scanDeviceVulnerabilities', {
          deviceType: mapOsToDeviceType(device?.os),
          version: device?.osVersion || 'latest',
          apps: [],
          extensions: [],
          team: 'blue',
        });
        setScanResult(result?.data ?? result);
        setActiveTab('overview');
        toast.success('Vulnerability scan completed');
      } catch (err) {
        toast.error(err?.message || 'Scan failed');
      } finally {
        setScanLoading(false);
      }
      return;
    }
    try {
      await actionMutation.mutateAsync({ deviceId, action });
      toast.success(`Action "${action}" initiated successfully`);
    } catch (error) {
      toast.error(`Failed to perform action: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Monitor className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-medium text-slate-900">Device not found</h2>
        <p className="text-slate-500 mt-1">The requested device could not be found.</p>
        <Link to={createPageUrl('Devices')}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Devices
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link to={createPageUrl('Devices')}>
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            device.status === 'online' ? "bg-emerald-100" :
            device.status === 'compromised' ? "bg-red-100" :
            device.status === 'isolated' ? "bg-purple-100" : "bg-slate-100"
          )}>
            <Monitor className={cn(
              "w-6 h-6",
              device.status === 'online' ? "text-emerald-600" :
              device.status === 'compromised' ? "text-red-600" :
              device.status === 'isolated' ? "text-purple-600" : "text-slate-400"
            )} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">{device.hostname}</h1>
              <StatusBadge status={device.status} />
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{device.ipAddress}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ActionButton
            icon={scanLoading ? Loader2 : Search}
            label={scanLoading ? 'Scanning...' : 'Run Scan'}
            onClick={() => handleAction('scan')}
            loading={scanLoading}
          />
          {device.status === 'isolated' ? (
            <ActionButton
              icon={Wifi}
              label="Remove Isolation"
              onClick={() => handleAction('unisolate')}
              loading={actionMutation.isPending}
            />
          ) : (
            <ActionButton
              icon={WifiOff}
              label="Isolate"
              onClick={() => handleAction('isolate')}
              variant="destructive"
              loading={actionMutation.isPending}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="alerts">Alerts ({alerts?.length || 0})</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              {/* Vulnerability Scan Results */}
              {scanResult && (
                <Card className="border-amber-500/30 bg-amber-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ShieldAlert className="w-5 h-5 text-amber-600" />
                      Vulnerability Scan Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {scanResult.device_info && (
                      <div className="p-3 bg-slate-50 rounded-lg text-sm">
                        <p><strong>Risk Score:</strong> {scanResult.device_info.risk_score ?? 'N/A'}</p>
                        <p><strong>Assessment:</strong> {scanResult.device_info.overall_assessment || 'N/A'}</p>
                      </div>
                    )}
                    {scanResult.vulnerabilities?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">CVEs & Issues</p>
                        <ul className="space-y-2 max-h-48 overflow-y-auto">
                          {scanResult.vulnerabilities.slice(0, 10).map((v, i) => (
                            <li key={i} className="p-2 bg-white rounded border text-xs">
                              <span className="font-mono text-red-600">{v.cve_id || v.title}</span>
                              {v.severity && <Badge className="ml-2 text-[10px]">{v.severity}</Badge>}
                              <p className="text-slate-600 mt-1">{v.description || v.remediation}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {scanResult.recommendations?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">Recommendations</p>
                        <ul className="list-disc pl-4 text-sm text-slate-600 space-y-1">
                          {scanResult.recommendations.slice(0, 5).map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Risk Score Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Security Posture</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-24 h-24 rounded-2xl flex flex-col items-center justify-center",
                      device.riskScore >= 80 ? "bg-red-50" :
                      device.riskScore >= 60 ? "bg-orange-50" :
                      device.riskScore >= 40 ? "bg-amber-50" : "bg-emerald-50"
                    )}>
                      <span className={cn(
                        "text-3xl font-bold",
                        device.riskScore >= 80 ? "text-red-600" :
                        device.riskScore >= 60 ? "text-orange-600" :
                        device.riskScore >= 40 ? "text-amber-600" : "text-emerald-600"
                      )}>
                        {device.riskScore}
                      </span>
                      <span className="text-xs text-slate-500">Risk Score</span>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">Protection Status</p>
                        <p className="text-sm font-medium text-emerald-600 flex items-center gap-1 mt-1">
                          <Shield className="w-4 h-4" />
                          Active
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">Agent Version</p>
                        <p className="text-sm font-medium text-slate-900 mt-1">{device.agentVersion}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">Policy</p>
                        <p className="text-sm font-medium text-slate-900 mt-1">{device.policyName || 'Default'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500">Last Scan</p>
                        <p className="text-sm font-medium text-slate-900 mt-1">2 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">System Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <InfoRow label="Operating System" value={device.osVersion} icon={Cpu} />
                  <InfoRow label="MAC Address" value={device.macAddress} icon={Network} />
                  <InfoRow label="Primary User" value={device.userName} icon={User} />
                  <InfoRow label="Department" value={device.department} icon={HardDrive} />
                  <InfoRow label="Location" value={device.location} icon={MapPin} />
                  <InfoRow 
                    label="Last Seen" 
                    value={device.lastSeen ? formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true }) : 'N/A'} 
                    icon={Clock} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {alertsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : alerts?.length === 0 ? (
                    <div className="py-12 text-center">
                      <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No alerts for this device</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {alerts?.map((alert) => (
                        <Link
                          key={alert.id}
                          to={createPageUrl(`AlertDetail?id=${alert.id}`)}
                          className="block p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <SeverityBadge severity={alert.severity} />
                                <StatusBadge status={alert.status} />
                              </div>
                              <p className="font-medium text-slate-900 mt-2">{alert.title}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {format(new Date(alert.createdDate), 'MMM d, yyyy HH:mm')}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {device.lastSeen && (
                      <div className="flex gap-4 p-3 bg-slate-50 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                        <div>
                          <p className="font-medium text-slate-900">Last seen online</p>
                          <p className="text-xs text-slate-500">{format(new Date(device.lastSeen), 'MMM d, yyyy HH:mm:ss')}</p>
                        </div>
                      </div>
                    )}
                    {alerts?.length > 0 ? (
                      alerts.map((alert) => (
                        <div key={alert.id} className="flex gap-4 p-3 bg-slate-50 rounded-lg">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-1.5",
                            alert.severity === 'critical' ? 'bg-red-500' :
                            alert.severity === 'high' ? 'bg-orange-500' : 'bg-amber-500'
                          )} />
                          <div>
                            <p className="font-medium text-slate-900">{alert.title}</p>
                            <p className="text-xs text-slate-500">{format(new Date(alert.createdDate), 'MMM d, yyyy HH:mm')} • {alert.status}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No recent activity</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">OS</span>
                <OsBadge os={device.os} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Status</span>
                <StatusBadge status={device.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Risk</span>
                <RiskScoreBadge score={device.riskScore} />
              </div>
            </CardContent>
          </Card>

          {device.tags?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {device.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Response Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={() => toast.info('Collect Logs queued. Requires agent backend integration.')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Collect Logs
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={() => toast.info('Restart Agent queued. Requires agent backend integration.')}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Restart Agent
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}