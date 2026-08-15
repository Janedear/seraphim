import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target,
  Activity,
  MapPin,
  Globe,
  Database,
  Shield,
  Play,
  Pause,
  Trash2,
  Plus,
  Info,
  Users,
  Eye,
  Clock
} from "lucide-react";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { toast } from "sonner";
import { api } from "@/api/client";

const TutorialBanner = ({ step, onNext }) => {
  const tutorials = [
    {
      icon: Info,
      title: "What is a Honeypot?",
      content: "A honeypot is a decoy system designed to lure attackers. It looks like a real target but is actually monitored to study attacker behavior and gather intelligence."
    },
    {
      icon: Target,
      title: "Why Deploy Honeypots?",
      content: "Honeypots help you: 1) Detect attacks early, 2) Study attacker techniques, 3) Collect evidence for law enforcement, 4) Distract attackers from real assets."
    },
    {
      icon: Shield,
      title: "How They Work",
      content: "When an attacker interacts with your honeypot, every action is logged: IP address, commands used, files accessed, and tools deployed. This creates a digital fingerprint."
    }
  ];

  const current = tutorials[step] || tutorials[0];
  const Icon = current.icon;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="pt-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-blue-700" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-blue-900 mb-1">{current.title}</p>
            <p className="text-sm text-blue-700 mb-3">{current.content}</p>
            <div className="flex items-center gap-2">
              {tutorials.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all ${
                    idx === step ? 'bg-blue-600 w-8' : 'bg-blue-300 w-4'
                  }`}
                />
              ))}
              <Button size="sm" variant="outline" className="ml-auto" onClick={onNext}>
                {step < tutorials.length - 1 ? 'Next Tip' : 'Got It'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const HoneypotCard = ({ honeypot, onToggle, onView, onDelete }) => {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    compromised: 'bg-red-100 text-red-800'
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-base">{honeypot.name}</CardTitle>
              <Badge className={statusColors[honeypot.status]}>
                {honeypot.status}
              </Badge>
              {honeypot.attackers > 0 && (
                <Badge variant="destructive">
                  {honeypot.attackers} attacker{honeypot.attackers > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">{honeypot.type} • {honeypot.port}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-500">Interactions</p>
              <p className="font-semibold text-lg">{honeypot.interactions}</p>
            </div>
            <div>
              <p className="text-slate-500">Data Captured</p>
              <p className="font-semibold text-lg">{honeypot.dataCaptured}</p>
            </div>
          </div>
          
          {honeypot.lastActivity && (
            <div className="text-xs text-slate-600">
              <p className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last activity: {honeypot.lastActivity}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onToggle(honeypot.id)}
            >
              {honeypot.status === 'active' ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
              {honeypot.status === 'active' ? 'Pause' : 'Start'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onView(honeypot.id)}>
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(honeypot.id)}>
              <Trash2 className="w-3 h-3 text-red-600" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AttackerCard = ({ attacker }) => {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-red-700" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-sm">{attacker.ip}</p>
              <Badge variant="outline">{attacker.country}</Badge>
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              <p className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {attacker.attempts} attack attempts
              </p>
              <p className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                First seen: {attacker.firstSeen}
              </p>
              <p className="font-mono bg-slate-100 px-2 py-1 rounded mt-2">
                Last command: {attacker.lastCommand}
              </p>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="flex-1">
                <Globe className="w-3 h-3 mr-1" />
                OSINT Report
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <MapPin className="w-3 h-3 mr-1" />
                Geolocate
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function HoneypotManager() {
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);

  const [honeypots, setHoneypots] = useState([]);
  const [configMessage, setConfigMessage] = useState(null);
  const [recentAttackers, setRecentAttackers] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.functions.invoke('listHoneypots', {});
        setHoneypots(data?.honeypots || []);
        setConfigMessage(data?.message);
      } catch (err) {
        toast.error('Failed to load honeypots');
        setHoneypots([]);
      }
    };
    load();
  }, []);


  const handleNextTutorial = () => {
    if (tutorialStep < 2) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
    }
  };

  const handleToggleHoneypot = async (id) => {
    const current = honeypots.find((h) => h.id === id);
    const status = current?.status === 'active' ? 'paused' : 'active';
    try {
      await api.entities.Honeypot.update(id, { status });
      setHoneypots(honeypots.map((h) => (h.id === id ? { ...h, status } : h)));
      toast.success('Honeypot status updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update honeypot');
    }
  };

  const handleViewHoneypot = (id) => {
    toast.info('Opening detailed honeypot analytics...');
  };

  const handleDeleteHoneypot = (id) => {
    setHoneypots(honeypots.filter(h => h.id !== id));
    toast.success('Honeypot removed');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Honeypot Manager"
        description="Deploy decoy systems to detect, track, and study attackers"
        actions={
          <Button onClick={() => setDeployDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Deploy Honeypot
          </Button>
        }
      />

      {configMessage && (
        <Card className="border-amber-500/50 bg-amber-950/30 mb-6">
          <CardContent className="pt-4">
            <p className="text-sm text-amber-200">{configMessage}</p>
          </CardContent>
        </Card>
      )}

      {showTutorial && (
        <TutorialBanner step={tutorialStep} onNext={handleNextTutorial} />
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{honeypots.filter(h => h.status === 'active').length}</p>
                <p className="text-xs text-slate-600">Active Honeypots</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-red-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{honeypots.reduce((a, h) => a + (h.attackers || 0), 0)}</p>
                <p className="text-xs text-slate-600">Unique Attackers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{honeypots.reduce((a, h) => a + (h.interactions || 0), 0)}</p>
                <p className="text-xs text-slate-600">Total Interactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Database className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(() => {
                  const total = honeypots.reduce((a, h) => {
                    const v = h.dataCaptured;
                    if (typeof v === 'number') return a + v;
                    const m = String(v || '0').match(/^([\d.]+)/);
                    return a + (m ? parseFloat(m[1]) : 0);
                  }, 0);
                  return total > 0 ? `${total.toFixed(1)} GB` : '0 GB';
                })()}</p>
                <p className="text-xs text-slate-600">Evidence Collected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="honeypots">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="honeypots">Active Honeypots</TabsTrigger>
          <TabsTrigger value="attackers">Tracked Attackers</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="honeypots" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {honeypots.map((honeypot) => (
              <HoneypotCard
                key={honeypot.id}
                honeypot={honeypot}
                onToggle={handleToggleHoneypot}
                onView={handleViewHoneypot}
                onDelete={handleDeleteHoneypot}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="attackers" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Attackers</CardTitle>
              <CardDescription>
                Attackers detected interacting with your honeypots in the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAttackers.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">
                  No attackers detected yet. Attackers will appear here when they interact with your honeypots.
                </p>
              ) : (
                recentAttackers.map((attacker) => (
                  <AttackerCard key={attacker.id} attacker={attacker} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">SSH Server (Beginner)</CardTitle>
                <CardDescription>Simulated SSH server on port 22. Captures login attempts and commands.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs text-slate-600 mb-4">
                  <p>✓ Easy to deploy</p>
                  <p>✓ Logs all credentials</p>
                  <p>✓ Records session activity</p>
                </div>
                <Button className="w-full" size="sm">
                  Deploy Now
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">Simulated Admin Panel (Intermediate)</CardTitle>
                <CardDescription>Web-based admin login. Captures credentials and tracks reconnaissance.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs text-slate-600 mb-4">
                  <p>✓ Realistic web interface</p>
                  <p>✓ Tracks browser fingerprints</p>
                  <p>✓ Logs all form submissions</p>
                </div>
                <Button className="w-full" size="sm">
                  Deploy Now
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">Database Server (Advanced)</CardTitle>
                <CardDescription>MySQL/PostgreSQL honeypot. Detects SQL injection attempts.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs text-slate-600 mb-4">
                  <p>✓ Emulates database responses</p>
                  <p>✓ Captures query attempts</p>
                  <p>✓ Identifies SQL injection patterns</p>
                </div>
                <Button className="w-full" size="sm">
                  Deploy Now
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">Vulnerable IoT Device (Expert)</CardTitle>
                <CardDescription>Mimics an insecure IoT device to attract botnet scanners.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs text-slate-600 mb-4">
                  <p>✓ Telnet/HTTP endpoints</p>
                  <p>✓ Weak default credentials</p>
                  <p>✓ Attracts botnet activity</p>
                </div>
                <Button className="w-full" size="sm">
                  Deploy Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}