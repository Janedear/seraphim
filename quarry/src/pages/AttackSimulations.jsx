import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Play,
  Target,
  AlertTriangle,
  Shield,
  Lock,
  Zap,
  Database,
  Server,
  Users,
  FileWarning,
  Activity } from
"lucide-react";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/api/client";

const SimulationCard = ({ simulation }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [target, setTarget] = useState('');
  const [intensity, setIntensity] = useState('medium');

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-blue-100 text-blue-800',
    advanced: 'bg-purple-100 text-purple-800',
    expert: 'bg-red-100 text-red-800'
  };

  const handleLaunch = async () => {
    setIsRunning(true);
    setProgress(10);
    try {
      const { data } = await api.functions.invoke('runAttackSimulation', {
        simulationType: simulation.id,
        target: target.trim() || undefined,
        intensity,
      });
      setProgress(100);
      if (data?.configured === false) {
        toast.error(data.error || 'Attack simulation not configured');
        return;
      }
      toast.success(data?.success ? `${simulation.name} simulation started` : (data?.error || 'Simulation complete'));
    } catch (err) {
      toast.error('Simulation failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsRunning(false);
      setProgress(0);
    }
  };

  return (
    <Card className="hover:shadow-[0_0_40px_rgba(255,50,50,0.3)] transition-all bg-black/40 backdrop-blur-md border-red-500/30">
      <CardHeader className="pb-3 p-6 opacity-100 flex flex-col space-y-1.5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(255,50,50,0.3)]">
              <simulation.icon className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base mb-1 text-white">{simulation.name}</CardTitle>
              <CardDescription className="text-xs text-red-200/70">{simulation.description}</CardDescription>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge className={difficultyColors[simulation.difficulty]}>
            {simulation.difficulty}
          </Badge>
          <Badge variant="outline" className="text-zinc-200 px-2.5 py-0.5 text-xs font-semibold rounded-md inline-flex items-center border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">{simulation.duration}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isRunning ?
          <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Running simulation...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div> :

          <>
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-medium">Tests for:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {simulation.tests.map((test, idx) =>
                <li key={idx}>{test}</li>
                )}
                </ul>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full">
                    <Play className="w-3 h-3 mr-2" />
                    Launch Simulation
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{simulation.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-amber-900 text-sm mb-1">Safety Notice</p>
                          <p className="text-xs text-amber-700">
                            This simulation will test your defenses in a controlled environment. 
                            No actual harm will occur, but alerts may be generated.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Target System (optional)</label>
                        <Input placeholder="e.g., 10.0.1.50 or leave blank for random" value={target} onChange={(e) => setTarget(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Intensity</label>
                        <select className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm" value={intensity} onChange={(e) => setIntensity(e.target.value)}>
                          <option value="low">Low - Minimal detection</option>
                          <option value="medium">Medium - Standard detection</option>
                          <option value="high">High - Full attack simulation</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Simulation Steps:</p>
                      <div className="text-xs space-y-1">
                        {simulation.steps.map((step, idx) =>
                      <div key={idx} className="flex items-start gap-2">
                            <span className="text-slate-500">{idx + 1}.</span>
                            <span>{step}</span>
                          </div>
                      )}
                      </div>
                    </div>

                    <Button className="w-full" onClick={handleLaunch} disabled={isRunning}>
                      <Play className="w-4 h-4 mr-2" />
                      {isRunning ? 'Running...' : 'Start Simulation'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          }
        </div>
      </CardContent>
    </Card>);

};

export default function AttackSimulations() {
  const simulations = [
  {
    id: 'ransomware',
    name: 'Ransomware Attack',
    icon: Lock,
    description: 'Simulates file encryption behavior and ransom note deployment',
    difficulty: 'advanced',
    duration: '15-20 min',
    tests: [
    'File encryption detection',
    'Ransom note creation alerts',
    'Shadow copy deletion detection',
    'Behavioral analysis triggers'],

    steps: [
    'Create test files in isolated directory',
    'Simulate encryption process',
    'Drop ransom note',
    'Test backup recovery',
    'Verify detection and blocking']

  },
  {
    id: 'ddos',
    name: 'DDoS Attack',
    icon: Zap,
    description: 'Tests network flood protection and rate limiting',
    difficulty: 'intermediate',
    duration: '10-15 min',
    tests: [
    'Network rate limiting',
    'Traffic anomaly detection',
    'Load balancer response',
    'Firewall rule effectiveness'],

    steps: [
    'Generate high-volume traffic',
    'Test SYN flood protection',
    'Verify rate limiting kicks in',
    'Monitor service availability',
    'Check mitigation effectiveness']

  },
  {
    id: 'sql-injection',
    name: 'SQL Injection',
    icon: Database,
    description: 'Tests web application input validation and WAF rules',
    difficulty: 'intermediate',
    duration: '5-10 min',
    tests: [
    'Input sanitization',
    'WAF detection rules',
    'Database query logging',
    'Error message handling'],

    steps: [
    'Send malicious SQL payloads',
    'Test parameterized queries',
    'Verify WAF blocking',
    'Check error disclosure',
    'Validate logging']

  },
  {
    id: 'brute-force',
    name: 'Brute Force Attack',
    icon: Target,
    description: 'Tests account lockout and rate limiting for authentication',
    difficulty: 'beginner',
    duration: '5-10 min',
    tests: [
    'Account lockout policies',
    'Failed login detection',
    'Rate limiting effectiveness',
    'Alert generation'],

    steps: [
    'Attempt multiple failed logins',
    'Test account lockout',
    'Verify CAPTCHA triggers',
    'Check MFA enforcement',
    'Monitor security alerts']

  },
  {
    id: 'lateral-movement',
    name: 'Lateral Movement',
    icon: Server,
    description: 'Simulates attacker moving between systems in the network',
    difficulty: 'expert',
    duration: '20-30 min',
    tests: [
    'Network segmentation',
    'Unusual authentication patterns',
    'Remote execution detection',
    'Zero trust controls'],

    steps: [
    'Authenticate to initial system',
    'Attempt SMB/RDP connections',
    'Test privilege escalation',
    'Monitor network traffic',
    'Verify segmentation enforcement']

  },
  {
    id: 'credential-dump',
    name: 'Credential Dumping',
    icon: Shield,
    description: 'Tests detection of tools like Mimikatz accessing LSASS',
    difficulty: 'advanced',
    duration: '10-15 min',
    tests: [
    'LSASS protection',
    'Credential Guard effectiveness',
    'Process access monitoring',
    'Memory protection'],

    steps: [
    'Simulate LSASS memory access',
    'Test credential extraction',
    'Verify detection alerts',
    'Check protection bypasses',
    'Validate response procedures']

  },
  {
    id: 'insider-threat',
    name: 'Insider Threat',
    icon: Users,
    description: 'Simulates malicious insider data exfiltration',
    difficulty: 'intermediate',
    duration: '15-20 min',
    tests: [
    'DLP effectiveness',
    'Unusual data access patterns',
    'Large file transfers',
    'After-hours activity'],

    steps: [
    'Access sensitive data',
    'Attempt large downloads',
    'Test USB blocking',
    'Try cloud uploads',
    'Monitor DLP alerts']

  },
  {
    id: 'apt',
    name: 'Advanced Persistent Threat',
    icon: FileWarning,
    description: 'Multi-stage APT campaign from initial access to exfiltration',
    difficulty: 'expert',
    duration: '30-45 min',
    tests: [
    'Initial access detection',
    'C2 communication blocking',
    'Persistence mechanisms',
    'Data exfiltration prevention'],

    steps: [
    'Deliver initial payload',
    'Establish persistence',
    'Beacon to C2 server',
    'Lateral movement attempt',
    'Data staging and exfiltration']

  },
  {
    id: 'supply-chain',
    name: 'Supply Chain Attack',
    icon: AlertTriangle,
    description: 'Tests detection of compromised third-party software',
    difficulty: 'advanced',
    duration: '15-20 min',
    tests: [
    'Software integrity checks',
    'Update verification',
    'Certificate validation',
    'Behavioral monitoring'],

    steps: [
    'Simulate malicious update',
    'Test code signing validation',
    'Monitor execution behavior',
    'Check network callbacks',
    'Verify containment']

  }];


  return (
    <div className="opacity-35 space-y-6">
      <PageHeader
        title="Attack Simulations"
        description="Test your defenses with realistic attack scenarios in controlled environment" />


      {/* Warning Banner */}
      <Card className="border-red-500/30 bg-red-500/5 backdrop-blur-md">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0 drop-shadow-[0_0_10px_rgba(255,50,50,0.8)]" />
            <div>
              <p className="font-semibold text-white text-sm mb-1">⚠️ Controlled Environment Only</p>
              <p className="text-xs text-red-100">
                All simulations run in isolated test environments and are logged for audit purposes. 
                Simulations may trigger security alerts and generate incident tickets. 
                Ensure you have authorization before running any simulation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(255,50,50,0.3)]">
                <Target className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">9</p>
                <p className="text-xs text-red-200/70">Attack Scenarios</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">156</p>
                <p className="text-xs text-red-200/70">Simulations Run</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">94%</p>
                <p className="text-xs text-red-200/70">Detection Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-md border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">23</p>
                <p className="text-xs text-red-200/70">Gaps Found</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="border-red-500/30 bg-red-500/5 backdrop-blur-md">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0 drop-shadow-[0_0_10px_rgba(255,50,50,0.6)]" />
            <div>
              <p className="font-semibold text-white text-sm mb-1">Why Run Attack Simulations?</p>
              <ul className="text-xs text-red-100 space-y-1">
                <li>✓ Validate security controls are working as expected</li>
                <li>✓ Identify gaps in detection and response capabilities</li>
                <li>✓ Train SOC analysts with realistic attack scenarios</li>
                <li>✓ Meet compliance requirements for security testing</li>
                <li>✓ Benchmark security posture improvements over time</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulations Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Available Simulations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {simulations.map((simulation) =>
          <SimulationCard
            key={simulation.id}
            simulation={simulation} />

          )}
        </div>
      </div>
    </div>);

}