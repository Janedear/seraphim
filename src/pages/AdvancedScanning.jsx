import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Scan,
  Microscope,
  Cpu,
  Network,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  Binary,
  Lock
} from "lucide-react";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { toast } from "sonner";

const ScanTypeCard = ({ title, description, icon: Icon, enabled, onToggle, intensity, onIntensityChange }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Icon className="w-5 h-5 text-slate-700" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs mt-1">{description}</CardDescription>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
      </CardHeader>
      {enabled && onIntensityChange && (
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <Label>Scan Intensity</Label>
              <Badge variant="outline">{intensity}%</Badge>
            </div>
            <Slider
              value={[intensity]}
              onValueChange={(v) => onIntensityChange(v[0])}
              max={100}
              step={10}
              className="w-full"
            />
            <p className="text-xs text-slate-500">
              Higher intensity = deeper analysis, longer scan time
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const ScanningModule = ({ module, onToggle }) => {
  const severityColor = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-sm">{module.name}</p>
          <Badge className={severityColor[module.detectLevel]}>
            {module.detectLevel} threats
          </Badge>
        </div>
        <p className="text-xs text-slate-600">{module.description}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {module.signatures.toLocaleString()} signatures
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            ~{module.scanTime}
          </span>
        </div>
      </div>
      <Switch checked={module.enabled} onCheckedChange={() => onToggle(module.id)} />
    </div>
  );
};

export default function AdvancedScanning() {
  const [scanTypes, setScanTypes] = useState({
    realtime: { enabled: true, intensity: 70 },
    memory: { enabled: true, intensity: 80 },
    rootkit: { enabled: true, intensity: 90 },
    firmware: { enabled: false, intensity: 60 },
    network: { enabled: true, intensity: 50 }
  });

  const [modules, setModules] = useState([
    {
      id: '1',
      name: 'Kernel-Level Hooks Monitor',
      description: 'Detect malicious kernel modifications and rootkits',
      enabled: true,
      detectLevel: 'critical',
      signatures: 15234,
      scanTime: '2-3 min'
    },
    {
      id: '2',
      name: 'Memory Forensics Engine',
      description: 'Scan RAM for in-memory malware and code injection',
      enabled: true,
      detectLevel: 'critical',
      signatures: 8921,
      scanTime: '5-7 min'
    },
    {
      id: '3',
      name: 'Behavioral Heuristics',
      description: 'AI-powered zero-day detection via behavior analysis',
      enabled: true,
      detectLevel: 'high',
      signatures: 42891,
      scanTime: '1-2 min'
    },
    {
      id: '4',
      name: 'Firmware/BIOS Scanner',
      description: 'Detect UEFI and firmware-level threats',
      enabled: false,
      detectLevel: 'critical',
      signatures: 3421,
      scanTime: '10-15 min'
    },
    {
      id: '5',
      name: 'Network Packet Inspector',
      description: 'Deep packet inspection for C2 communication',
      enabled: true,
      detectLevel: 'high',
      signatures: 18765,
      scanTime: 'Continuous'
    },
    {
      id: '6',
      name: 'Dark Web Malware Database',
      description: 'Match against latest dark web threat samples',
      enabled: true,
      detectLevel: 'critical',
      signatures: 98234,
      scanTime: '3-4 min'
    },
    {
      id: '7',
      name: 'Sandbox Environment',
      description: 'Execute suspicious files in isolated environment',
      enabled: true,
      detectLevel: 'high',
      signatures: 0,
      scanTime: '5-10 min'
    },
    {
      id: '8',
      name: 'Cryptographic Analysis',
      description: 'Detect encryption/ransomware patterns',
      enabled: true,
      detectLevel: 'critical',
      signatures: 5678,
      scanTime: '2-3 min'
    }
  ]);

  const [settings, setSettings] = useState({
    maxCpuUsage: 70,
    priority: 'balanced',
    deepScanFrequency: 'weekly'
  });

  const handleToggleScanType = (type) => {
    setScanTypes({
      ...scanTypes,
      [type]: { ...scanTypes[type], enabled: !scanTypes[type].enabled }
    });
  };

  const handleIntensityChange = (type, value) => {
    setScanTypes({
      ...scanTypes,
      [type]: { ...scanTypes[type], intensity: value }
    });
  };

  const handleToggleModule = (id) => {
    setModules(modules.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
    toast.success('Scan module updated');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advanced Scanning"
        description="Configure deep threat detection and forensic analysis"
        actions={
          <Button>
            <Scan className="w-4 h-4 mr-2" />
            Run Full Deep Scan
          </Button>
        }
      />

      {/* Status Banner */}
      <Card className="border-blue-500/30 bg-black/20 backdrop-blur-md">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-700" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-blue-900">Enterprise-Grade Scanning Active</p>
              <p className="text-sm text-blue-700">All modules running locally with zero data exfiltration</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-900">8/8</p>
              <p className="text-xs text-blue-700">Modules Active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan Types */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Scan Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ScanTypeCard
            title="Real-Time Protection"
            description="Continuous monitoring of all file system operations"
            icon={Zap}
            enabled={scanTypes.realtime.enabled}
            onToggle={() => handleToggleScanType('realtime')}
            intensity={scanTypes.realtime.intensity}
            onIntensityChange={(v) => handleIntensityChange('realtime', v)}
          />
          <ScanTypeCard
            title="Memory Analysis"
            description="Deep RAM scanning for in-memory threats"
            icon={Cpu}
            enabled={scanTypes.memory.enabled}
            onToggle={() => handleToggleScanType('memory')}
            intensity={scanTypes.memory.intensity}
            onIntensityChange={(v) => handleIntensityChange('memory', v)}
          />
          <ScanTypeCard
            title="Rootkit Detection"
            description="Kernel-level inspection for persistent threats"
            icon={Binary}
            enabled={scanTypes.rootkit.enabled}
            onToggle={() => handleToggleScanType('rootkit')}
            intensity={scanTypes.rootkit.intensity}
            onIntensityChange={(v) => handleIntensityChange('rootkit', v)}
          />
          <ScanTypeCard
            title="Firmware/BIOS Scan"
            description="UEFI and firmware integrity verification"
            icon={Microscope}
            enabled={scanTypes.firmware.enabled}
            onToggle={() => handleToggleScanType('firmware')}
            intensity={scanTypes.firmware.intensity}
            onIntensityChange={(v) => handleIntensityChange('firmware', v)}
          />
          <ScanTypeCard
            title="Network Inspection"
            description="Deep packet analysis for C2 communication"
            icon={Network}
            enabled={scanTypes.network.enabled}
            onToggle={() => handleToggleScanType('network')}
            intensity={scanTypes.network.intensity}
            onIntensityChange={(v) => handleIntensityChange('network', v)}
          />
        </div>
      </div>

      {/* Detection Modules */}
      <Card>
        <CardHeader>
          <CardTitle>Detection Modules</CardTitle>
          <CardDescription>
            Enable specific threat detection engines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {modules.map((module) => (
            <ScanningModule
              key={module.id}
              module={module}
              onToggle={handleToggleModule}
            />
          ))}
        </CardContent>
      </Card>

      {/* Performance Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Performance & Scheduling</CardTitle>
          <CardDescription>
            Balance between protection depth and system performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label>Maximum CPU Usage</Label>
              <Badge variant="outline">{settings.maxCpuUsage}%</Badge>
            </div>
            <Slider
              value={[settings.maxCpuUsage]}
              onValueChange={(v) => setSettings({ ...settings, maxCpuUsage: v[0] })}
              max={100}
              step={5}
            />
          </div>

          <div className="space-y-2">
            <Label>Scan Priority</Label>
            <Select
              value={settings.priority}
              onValueChange={(v) => setSettings({ ...settings, priority: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (Minimal system impact)</SelectItem>
                <SelectItem value="balanced">Balanced (Recommended)</SelectItem>
                <SelectItem value="high">High (Maximum protection)</SelectItem>
                <SelectItem value="critical">Critical (All resources)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Deep Scan Frequency</Label>
            <Select
              value={settings.deepScanFrequency}
              onValueChange={(v) => setSettings({ ...settings, deepScanFrequency: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Every Hour</SelectItem>
                <SelectItem value="daily">Daily (2:00 AM)</SelectItem>
                <SelectItem value="weekly">Weekly (Sunday 2:00 AM)</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="manual">Manual Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card className="border-emerald-500/30 bg-black/20 backdrop-blur-md">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-green-700 mt-0.5" />
            <div>
              <p className="font-medium text-green-900 text-sm">Privacy Guarantee</p>
              <p className="text-xs text-green-700 mt-1">
                All scanning operations execute locally on endpoint devices. No file samples, hashes, or metadata are transmitted externally. Threat intelligence updates use encrypted, air-gapped channels with certificate pinning.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}