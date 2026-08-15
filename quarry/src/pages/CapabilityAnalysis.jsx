import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui-custom/PageHeader';

const CapabilityAnalysis = () => {
  const [expandedPhase, setExpandedPhase] = useState(null);

  const capabilityDomains = [
    {
      domain: 'Reconnaissance & Intelligence',
      coverage: '45%',
      status: 'partial',
      current: ['OSINT Tools', 'Breach Recon', 'Network Discovery', 'Threat Intel', 'Attacker Profile'],
      missing: ['ASN/BGP Intelligence', 'DNS Enumeration Depth', 'SSL/TLS Recon', 'Web Tech Fingerprinting', 'Cloud Asset Discovery', 'Supply Chain Mapping']
    },
    {
      domain: 'Initial Access',
      coverage: '35%',
      status: 'partial',
      current: ['Phishing Campaigns', 'Social Engineering', 'Attack Simulations'],
      missing: ['Web App Exploitation', 'Wireless Vectors', 'API-based Access', 'Cloud Misconfiguration', 'VPN/Remote Access Abuse']
    },
    {
      domain: 'Execution',
      coverage: '40%',
      status: 'partial',
      current: ['Payload Generator', 'Web Exploit Tools', 'Encoders/Decoders'],
      missing: ['Agent/Beacon Architecture', 'Living-off-the-Land (LOLBin)', 'In-Memory Execution', 'Process Injection', 'Cross-Platform Payloads']
    },
    {
      domain: 'Persistence',
      coverage: '0%',
      status: 'critical-gap',
      current: [],
      missing: ['Account-based Persistence', 'Service Persistence', 'Scheduled Task Persistence', 'Registry/Filesystem Persistence', 'Cloud Persistence', 'Boot/Firmware Awareness']
    },
    {
      domain: 'Privilege Escalation',
      coverage: '0%',
      status: 'critical-gap',
      current: [],
      missing: ['Local Privesc', 'Domain Privesc', 'Cloud IAM Escalation', 'Kernel Exploit Integration', 'Container Escape']
    },
    {
      domain: 'Credential Access',
      coverage: '0%',
      status: 'critical-gap',
      current: [],
      missing: ['Credential Dumping', 'Memory Analysis', 'Secrets Store Access', 'Browser Credential Theft', 'Cloud Credential Exposure', 'Hash Cracking']
    },
    {
      domain: 'Lateral Movement',
      coverage: '0%',
      status: 'critical-gap',
      current: [],
      missing: ['Network Enumeration', 'Credential-based Movement', 'Trust Relationship Abuse', 'Jump Host Methodology', 'Cross-Domain Movement']
    },
    {
      domain: 'Command & Control',
      coverage: '0%',
      status: 'critical-gap',
      current: [],
      missing: ['Multi-Channel C2 Framework', 'Agent/Beacon Architecture', 'Encryption/Obfuscation', 'Resilience Mechanisms', 'Cloud-Based C2']
    },
    {
      domain: 'Defense Evasion',
      coverage: '0%',
      status: 'critical-gap',
      current: [],
      missing: ['EDR Evasion', 'AV Evasion', 'Firewall/IDS Evasion', 'Log Tampering', 'Behavioral Detection Bypass', 'Sandbox Evasion']
    },
    {
      domain: 'Exfiltration',
      coverage: '0%',
      status: 'critical-gap',
      current: [],
      missing: ['Multi-Channel Exfiltration', 'Data Staging', 'Cloud Exfiltration', 'Detection Evasion', 'Rate Limiting']
    }
  ];

  const phases = [
    {
      phase: 'Phase 1: Foundation',
      timeline: 'Months 1-3',
      status: 'Planned',
      priority: 'CRITICAL',
      components: [
        { name: 'Enhance ToolStaging', category: 'Infrastructure' },
        { name: 'C2 Framework (MVP)', category: 'C2' },
        { name: 'Credential Access (Initial)', category: 'Credential Access' }
      ]
    },
    {
      phase: 'Phase 2: Core Attack Chain',
      timeline: 'Months 4-6',
      status: 'Planned',
      priority: 'HIGH',
      components: [
        { name: 'Privilege Escalation Module', category: 'Privilege Escalation' },
        { name: 'Lateral Movement Module', category: 'Lateral Movement' },
        { name: 'Persistence Framework', category: 'Persistence' }
      ]
    },
    {
      phase: 'Phase 3: Operational Excellence',
      timeline: 'Months 7-9',
      status: 'Planned',
      priority: 'HIGH',
      components: [
        { name: 'Defense Evasion Module', category: 'Defense Evasion' },
        { name: 'Data Exfiltration', category: 'Exfiltration' },
        { name: 'Campaign Orchestration', category: 'Infrastructure' }
      ]
    },
    {
      phase: 'Phase 4: Ecosystem Expansion',
      timeline: 'Months 10-12',
      status: 'Planned',
      priority: 'MEDIUM',
      components: [
        { name: 'Reconnaissance Expansion', category: 'Reconnaissance' },
        { name: 'Initial Access Expansion', category: 'Initial Access' },
        { name: 'Execution Expansion', category: 'Execution' }
      ]
    }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'partial': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'critical-gap': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'partial': return <AlertCircle className="w-4 h-4" />;
      case 'critical-gap': return <AlertCircle className="w-4 h-4" />;
      default: return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Red-Team Capability Analysis"
        description="Comprehensive mapping of attack domains, coverage analysis, and multi-phase expansion roadmap"
      />

      {/* Overview Card */}
      <Card className="bg-black/40 backdrop-blur-md border-red-500/50">
        <CardHeader>
          <CardTitle className="text-white">Platform Coverage Assessment</CardTitle>
          <CardDescription>Current state vs. full red-team universe equivalent to Kali/Parrot/Arch</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Partial Coverage</p>
              <p className="text-2xl font-bold text-yellow-400">4/10</p>
              <p className="text-xs text-slate-500">domains</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Critical Gaps</p>
              <p className="text-2xl font-bold text-red-400">6/10</p>
              <p className="text-xs text-slate-500">domains</p>
            </div>
            <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Overall Coverage</p>
              <p className="text-2xl font-bold text-cyan-400">~40%</p>
              <p className="text-xs text-slate-500">of full universe</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capability Domain Matrix */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Attack Domain Coverage</h2>
        <div className="grid grid-cols-1 gap-4">
          {capabilityDomains.map((domain, idx) => (
            <Card key={idx} className="bg-black/40 backdrop-blur-md border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-white text-base">{domain.domain}</CardTitle>
                      <Badge className={`${getStatusColor(domain.status)} border`}>
                        {domain.coverage}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {domain.current.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-400 mb-2">✅ Current Implementation</p>
                    <div className="flex flex-wrap gap-2">
                      {domain.current.map((item, i) => (
                        <Badge key={i} variant="outline" className="bg-green-900/20 border-green-700/50 text-green-300 text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {domain.missing.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-400 mb-2">❌ Missing Capabilities</p>
                    <div className="flex flex-wrap gap-2">
                      {domain.missing.map((item, i) => (
                        <Badge key={i} variant="outline" className="bg-red-900/20 border-red-700/50 text-red-300 text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Phased Roadmap */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Multi-Phase Expansion Roadmap</h2>
        <div className="grid grid-cols-1 gap-4">
          {phases.map((p, idx) => (
            <Card 
              key={idx} 
              className="bg-black/40 backdrop-blur-md border-slate-700 cursor-pointer hover:border-red-500/50 transition-colors"
              onClick={() => setExpandedPhase(expandedPhase === idx ? null : idx)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      {p.phase}
                      <Badge variant="outline" className={
                        p.priority === 'CRITICAL' ? 'bg-red-900/30 border-red-700 text-red-300' :
                        p.priority === 'HIGH' ? 'bg-amber-900/30 border-amber-700 text-amber-300' :
                        'bg-blue-900/30 border-blue-700 text-blue-300'
                      }>
                        {p.priority}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-400">{p.timeline}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              {expandedPhase === idx && (
                <CardContent className="space-y-3 border-t border-slate-700 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {p.components.map((comp, i) => (
                      <div key={i} className="p-3 bg-slate-800/50 rounded border border-slate-700">
                        <p className="text-xs font-medium text-slate-400 mb-1">{comp.category}</p>
                        <p className="text-sm text-white font-medium">{comp.name}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Critical Success Factors */}
      <Card className="bg-black/40 backdrop-blur-md border-yellow-500/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            Critical Success Factors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="text-slate-300"><strong>1. Agent Architecture:</strong> Multi-stage stager/stage design is P1 critical</p>
            <p className="text-slate-300"><strong>2. C2 Communication:</strong> HTTP/HTTPS listener MVP before Phase 2</p>
            <p className="text-slate-300"><strong>3. Encrypted Credential Storage:</strong> Vault + ACL required for Phase 2</p>
            <p className="text-slate-300"><strong>4. Campaign State Machine:</strong> Multi-phase operation tracking for Phase 2+</p>
            <p className="text-slate-300"><strong>5. EDR Awareness Database:</strong> Evasion patterns and blind spots for Phase 3</p>
            <p className="text-slate-300"><strong>6. Operational Security Logging:</strong> All operations tracked via AuditLog</p>
          </div>
        </CardContent>
      </Card>

      {/* Architecture Principles */}
      <Card className="bg-black/40 backdrop-blur-md border-blue-500/50">
        <CardHeader>
          <CardTitle className="text-white">Architecture Principles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <div><strong>Modular Orchestration:</strong> Each attack domain = standalone module integrated via ToolStaging</div>
          <div><strong>Entity-Driven Design:</strong> Attack artifacts stored as entities (Vulnerability, Credential, Agent, etc.)</div>
          <div><strong>Backend-Heavy Processing:</strong> Complex logic in orchestrator functions, frontend for parameterization + visualization</div>
          <div><strong>Integration Points:</strong> ToolStaging, PayloadGenerator, C2Framework, MCP/AI integration</div>
          <div><strong>Reusability:</strong> Payloads → execution, credentials → lateral movement, agents → command execution</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CapabilityAnalysis;