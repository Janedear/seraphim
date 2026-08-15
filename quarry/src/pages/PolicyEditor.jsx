import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  ArrowLeft,
  Save,
  Globe,
  Clock,
  Lock,
  Usb,
  Flame
} from "lucide-react";
import { usePolicy, useCreatePolicy, useUpdatePolicy } from '@/components/hooks/useApi';
import { toast } from "sonner";
import { useAuth } from '@/lib/AuthContext';

const SettingToggle = ({ label, description, checked, onCheckedChange, disabled }) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
    <div className="flex-1 pr-4">
      <Label className="text-sm font-medium text-slate-900">{label}</Label>
      {description && (
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      )}
    </div>
    <Switch 
      checked={checked} 
      onCheckedChange={onCheckedChange}
      disabled={disabled}
    />
  </div>
);

const SectionCard = ({ icon: Icon, title, description, children }) => (
  <Card>
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
          )}
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);

export default function PolicyEditor() {
  const urlParams = new URLSearchParams(window.location.search);
  const policyId = urlParams.get('id');
  const isEditing = !!policyId;
  const navigate = useNavigate();

  const { canEdit } = useAuth();
  const { data: existingPolicy, isLoading } = usePolicy(policyId);
  const createMutation = useCreatePolicy();
  const updateMutation = useUpdatePolicy();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false,
    // Real-time Protection
    realtimeProtection: true,
    cloudLookup: true,
    behavioralAnalysis: true,
    exploitProtection: true,
    // Scan Settings
    scanSchedule: 'weekly',
    scanTime: '02:00',
    scanType: 'quick',
    // Web Protection
    webProtection: true,
    blockMaliciousUrls: true,
    blockPhishing: true,
    sslInspection: false,
    // Ransomware Protection
    ransomwareProtection: true,
    ransomwareRollback: true,
    protectedFolders: ['Documents', 'Desktop', 'Downloads'],
    // Device Control
    deviceControl: false,
    blockUsb: false,
    blockBluetooth: false,
    // Firewall
    firewallEnabled: true,
    // Exclusions
    exclusions: []
  });

  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (existingPolicy) {
      setFormData({
        name: existingPolicy.name || '',
        description: existingPolicy.description || '',
        isDefault: existingPolicy.isDefault || false,
        realtimeProtection: existingPolicy.realtimeProtection ?? true,
        cloudLookup: existingPolicy.cloudLookup ?? true,
        behavioralAnalysis: existingPolicy.behavioralAnalysis ?? true,
        exploitProtection: existingPolicy.exploitProtection ?? true,
        scanSchedule: existingPolicy.scanSchedule || 'weekly',
        scanTime: existingPolicy.scanTime || '02:00',
        scanType: existingPolicy.scanType || 'quick',
        webProtection: existingPolicy.webProtection ?? true,
        blockMaliciousUrls: existingPolicy.blockMaliciousUrls ?? true,
        blockPhishing: existingPolicy.blockPhishing ?? true,
        sslInspection: existingPolicy.sslInspection || false,
        ransomwareProtection: existingPolicy.ransomwareProtection ?? true,
        ransomwareRollback: existingPolicy.ransomwareRollback ?? true,
        protectedFolders: existingPolicy.protectedFolders || [],
        deviceControl: existingPolicy.deviceControl || false,
        blockUsb: existingPolicy.blockUsb || false,
        blockBluetooth: existingPolicy.blockBluetooth || false,
        firewallEnabled: existingPolicy.firewallEnabled ?? true,
        exclusions: existingPolicy.exclusions || []
      });
    }
  }, [existingPolicy]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Policy name is required');
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: policyId, data: formData });
        toast.success('Policy updated successfully');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Policy created successfully');
      }
      navigate(createPageUrl('Policies'));
    } catch (error) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} policy`);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading && isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Policies')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {isEditing ? 'Edit Policy' : 'Create Policy'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Configure endpoint protection settings
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving || !canEdit}>
          {isSaving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Policy
            </>
          )}
        </Button>
      </div>

      {/* Form */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="protection">Protection</TabsTrigger>
          <TabsTrigger value="scanning">Scanning</TabsTrigger>
          <TabsTrigger value="web">Web Protection</TabsTrigger>
          <TabsTrigger value="ransomware">Ransomware</TabsTrigger>
          <TabsTrigger value="device">Device Control</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Policy Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Policy Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter policy name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe this policy"
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Set as Default Policy</Label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    New devices will be assigned this policy automatically
                  </p>
                </div>
                <Switch
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => handleChange('isDefault', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="protection" className="mt-6 space-y-6">
          <SectionCard
            icon={Shield}
            title="Real-time Protection"
            description="Continuous monitoring for threats"
          >
            <SettingToggle
              label="Real-time Protection"
              description="Monitor files and processes in real-time"
              checked={formData.realtimeProtection}
              onCheckedChange={(v) => handleChange('realtimeProtection', v)}
            />
            <SettingToggle
              label="Cloud Lookup"
              description="Check file reputation with cloud database"
              checked={formData.cloudLookup}
              onCheckedChange={(v) => handleChange('cloudLookup', v)}
            />
            <SettingToggle
              label="Behavioral Analysis"
              description="Detect threats based on behavior patterns"
              checked={formData.behavioralAnalysis}
              onCheckedChange={(v) => handleChange('behavioralAnalysis', v)}
            />
            <SettingToggle
              label="Exploit Protection"
              description="Protect against memory-based attacks"
              checked={formData.exploitProtection}
              onCheckedChange={(v) => handleChange('exploitProtection', v)}
            />
          </SectionCard>

          <SectionCard
            icon={Lock}
            title="Firewall"
            description="Network traffic filtering"
          >
            <SettingToggle
              label="Firewall Enabled"
              description="Monitor and filter network connections"
              checked={formData.firewallEnabled}
              onCheckedChange={(v) => handleChange('firewallEnabled', v)}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="scanning" className="mt-6 space-y-6">
          <SectionCard
            icon={Clock}
            title="Scheduled Scans"
            description="Automatic periodic scanning"
          >
            <div className="space-y-4">
              <div>
                <Label>Scan Schedule</Label>
                <Select
                  value={formData.scanSchedule}
                  onValueChange={(v) => handleChange('scanSchedule', v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disabled">Disabled</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.scanSchedule !== 'disabled' && (
                <>
                  <div>
                    <Label>Scan Time</Label>
                    <Input
                      type="time"
                      value={formData.scanTime}
                      onChange={(e) => handleChange('scanTime', e.target.value)}
                      className="mt-1 w-32"
                    />
                  </div>
                  <div>
                    <Label>Scan Type</Label>
                    <Select
                      value={formData.scanType}
                      onValueChange={(v) => handleChange('scanType', v)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quick">Quick Scan</SelectItem>
                        <SelectItem value="full">Full Scan</SelectItem>
                        <SelectItem value="custom">Custom Scan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="web" className="mt-6 space-y-6">
          <SectionCard
            icon={Globe}
            title="Web Protection"
            description="Browser and network threat protection"
          >
            <SettingToggle
              label="Web Protection"
              description="Enable web filtering and protection"
              checked={formData.webProtection}
              onCheckedChange={(v) => handleChange('webProtection', v)}
            />
            <SettingToggle
              label="Block Malicious URLs"
              description="Block access to known malicious websites"
              checked={formData.blockMaliciousUrls}
              onCheckedChange={(v) => handleChange('blockMaliciousUrls', v)}
              disabled={!formData.webProtection}
            />
            <SettingToggle
              label="Block Phishing Sites"
              description="Protect against phishing attempts"
              checked={formData.blockPhishing}
              onCheckedChange={(v) => handleChange('blockPhishing', v)}
              disabled={!formData.webProtection}
            />
            <SettingToggle
              label="SSL Inspection"
              description="Inspect encrypted traffic (requires certificate deployment)"
              checked={formData.sslInspection}
              onCheckedChange={(v) => handleChange('sslInspection', v)}
              disabled={!formData.webProtection}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="ransomware" className="mt-6 space-y-6">
          <SectionCard
            icon={Flame}
            title="Ransomware Protection"
            description="Protect against file encryption attacks"
          >
            <SettingToggle
              label="Ransomware Protection"
              description="Monitor for ransomware behavior and block encryption"
              checked={formData.ransomwareProtection}
              onCheckedChange={(v) => handleChange('ransomwareProtection', v)}
            />
            <SettingToggle
              label="Automatic Rollback"
              description="Automatically restore files encrypted by ransomware"
              checked={formData.ransomwareRollback}
              onCheckedChange={(v) => handleChange('ransomwareRollback', v)}
              disabled={!formData.ransomwareProtection}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="device" className="mt-6 space-y-6">
          <SectionCard
            icon={Usb}
            title="Device Control"
            description="Control peripheral device access"
          >
            <SettingToggle
              label="Device Control"
              description="Enable control over USB and other devices"
              checked={formData.deviceControl}
              onCheckedChange={(v) => handleChange('deviceControl', v)}
            />
            <SettingToggle
              label="Block USB Storage"
              description="Prevent access to USB storage devices"
              checked={formData.blockUsb}
              onCheckedChange={(v) => handleChange('blockUsb', v)}
              disabled={!formData.deviceControl}
            />
            <SettingToggle
              label="Block Bluetooth"
              description="Disable Bluetooth connections"
              checked={formData.blockBluetooth}
              onCheckedChange={(v) => handleChange('blockBluetooth', v)}
              disabled={!formData.deviceControl}
            />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}