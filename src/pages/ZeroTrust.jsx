import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Lock,
  Eye,
  Network,
  Fingerprint,
  Key,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Server,
  Globe,
  Plus,
  Trash2
} from "lucide-react";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { toast } from "sonner";

const SecurityPolicyCard = ({ policy, enabled, onToggle }) => {
  const statusColor = enabled ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600';
  const Icon = policy.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Icon className="w-5 h-5 text-slate-700" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base">{policy.title}</CardTitle>
                <Badge className={statusColor}>
                  {enabled ? 'Active' : 'Disabled'}
                </Badge>
              </div>
              <CardDescription className="text-xs">{policy.description}</CardDescription>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
      </CardHeader>
      {enabled && policy.metrics && (
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 text-xs text-slate-600">
            {policy.metrics.map((metric, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                <span>{metric}</span>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const TrustedEntityCard = ({ entity, onRemove }) => {
  const typeColors = {
    application: 'bg-blue-100 text-blue-800',
    certificate: 'bg-purple-100 text-purple-800',
    process: 'bg-green-100 text-green-800',
    network: 'bg-orange-100 text-orange-800'
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Badge className={typeColors[entity.type]}>{entity.type}</Badge>
          {entity.verified && <CheckCircle2 className="w-4 h-4 text-green-600" />}
        </div>
        <p className="font-medium text-sm">{entity.name}</p>
        <p className="text-xs text-slate-500 font-mono mt-1">{entity.identifier}</p>
        <p className="text-xs text-slate-400 mt-1">Added: {entity.addedDate}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => onRemove(entity.id)}>
        <Trash2 className="w-4 h-4 text-red-600" />
      </Button>
    </div>
  );
};

export default function ZeroTrust() {
  const [policies, setPolicies] = useState({
    defaultDeny: true,
    microSegmentation: true,
    continuousVerification: true,
    leastPrivilege: true,
    encryptEverything: true,
    mfa: false,
    devicePosture: true,
    networkIsolation: true
  });

  const [trustedEntities, setTrustedEntities] = useState([
    {
      id: '1',
      type: 'application',
      name: 'Microsoft Office Suite',
      identifier: 'C:\\Program Files\\Microsoft Office\\',
      verified: true,
      addedDate: '2024-01-15'
    },
    {
      id: '2',
      type: 'certificate',
      name: 'Company Code Signing Cert',
      identifier: '5F:3A:7B:9C:2D:8E:1F:4A:6B:9D:3E:7C:5A:8F:2B:6D',
      verified: true,
      addedDate: '2024-01-10'
    },
    {
      id: '3',
      type: 'process',
      name: 'Endpoint Agent',
      identifier: 'endpoint-agent.exe',
      verified: true,
      addedDate: '2024-01-05'
    }
  ]);

  const securityPolicies = [
    {
      id: 'defaultDeny',
      title: 'Default Deny All',
      description: 'Block everything by default, allow only explicitly trusted',
      icon: ShieldAlert,
      metrics: ['100% coverage', 'Zero implicit trust']
    },
    {
      id: 'microSegmentation',
      title: 'Micro-Segmentation',
      description: 'Isolate workloads and enforce granular access controls',
      icon: Network,
      metrics: ['Per-app isolation', 'Network-level enforcement']
    },
    {
      id: 'continuousVerification',
      title: 'Continuous Verification',
      description: 'Verify identity and posture on every request',
      icon: Eye,
      metrics: ['Real-time checks', 'Never trust, always verify']
    },
    {
      id: 'leastPrivilege',
      title: 'Least Privilege Access',
      description: 'Grant minimum permissions required for operation',
      icon: Key,
      metrics: ['Minimal permissions', 'Time-bound access']
    },
    {
      id: 'encryptEverything',
      title: 'End-to-End Encryption',
      description: 'Encrypt all data in transit and at rest',
      icon: Lock,
      metrics: ['AES-256', 'TLS 1.3 minimum']
    },
    {
      id: 'mfa',
      title: 'Multi-Factor Authentication',
      description: 'Require MFA for all administrative actions',
      icon: Fingerprint
    },
    {
      id: 'devicePosture',
      title: 'Device Posture Validation',
      description: 'Verify device health before granting access',
      icon: Server,
      metrics: ['Compliance checks', 'Health attestation']
    },
    {
      id: 'networkIsolation',
      title: 'Network Isolation',
      description: 'Isolate compromised devices from network',
      icon: Globe,
      metrics: ['Auto-quarantine', 'Lateral movement prevention']
    }
  ];

  const handleTogglePolicy = (policyId) => {
    setPolicies({ ...policies, [policyId]: !policies[policyId] });
    toast.success('Policy updated');
  };

  const handleRemoveEntity = (id) => {
    setTrustedEntities(trustedEntities.filter(e => e.id !== id));
    toast.success('Trusted entity removed');
  };

  const activePoliciesCount = Object.values(policies).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zero Trust Architecture"
        description="Never trust, always verify - comprehensive security hardening"
      />

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">{activePoliciesCount}/{securityPolicies.length}</p>
                <p className="text-sm text-slate-600">Policies Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">{trustedEntities.length}</p>
                <p className="text-sm text-slate-600">Trusted Entities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Lock className="w-6 h-6 text-purple-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">100%</p>
                <p className="text-sm text-slate-600">Network Encrypted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Policies */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Security Policies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {securityPolicies.map((policy) => (
            <SecurityPolicyCard
              key={policy.id}
              policy={policy}
              enabled={policies[policy.id]}
              onToggle={() => handleTogglePolicy(policy.id)}
            />
          ))}
        </div>
      </div>

      {/* Trusted Entities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Trusted Entities</CardTitle>
              <CardDescription>
                Explicitly trusted applications, certificates, and processes
              </CardDescription>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Trusted Entity
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {trustedEntities.map((entity) => (
            <TrustedEntityCard
              key={entity.id}
              entity={entity}
              onRemove={handleRemoveEntity}
            />
          ))}
        </CardContent>
      </Card>

      {/* Network Segmentation */}
      <Card>
        <CardHeader>
          <CardTitle>Network Segmentation Rules</CardTitle>
          <CardDescription>
            Define allowed network communication paths
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <Badge>Rule 1</Badge>
                <Switch defaultChecked />
              </div>
              <p className="text-sm font-medium">Allow: Finance → Database (Port 3306)</p>
              <p className="text-xs text-slate-500 mt-1">Source: 10.0.1.0/24 → Dest: 10.0.5.10</p>
            </div>
            <div className="p-4 border rounded-lg bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <Badge>Rule 2</Badge>
                <Switch defaultChecked />
              </div>
              <p className="text-sm font-medium">Block: All → Internet (Except HTTPS)</p>
              <p className="text-xs text-slate-500 mt-1">Default deny with explicit allowlist</p>
            </div>
            <Button variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Segmentation Rule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 text-sm">Zero Trust Enforcement Active</p>
              <p className="text-xs text-amber-700 mt-1">
                All network traffic, processes, and file operations are verified against zero trust policies. Default deny is enforced - only explicitly trusted entities can operate. This provides maximum security against insider threats, lateral movement, and advanced persistent threats.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}