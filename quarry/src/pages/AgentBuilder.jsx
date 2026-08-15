import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { api } from '@/api/client';
import { useQuery } from '@tanstack/react-query';
import { Download, Zap, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AgentBuilder() {
  const [step, setStep] = useState('select-server');
  const [selectedServer, setSelectedServer] = useState(null);
  const [selectedListener, setSelectedListener] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [platform, setPlatform] = useState('windows');
  const [architecture, setArchitecture] = useState('x64');
  const [outputFormat, setOutputFormat] = useState('exe');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStager, setGeneratedStager] = useState(null);

  // Fetch data
  const { data: c2Servers = [] } = useQuery({
    queryKey: ['c2_servers'],
    queryFn: async () => {
      try {
        return await api.entities.C2Server?.filter({ status: 'active' }) ?? [];
      } catch {
        return [];
      }
    }
  });

  const { data: listeners = [] } = useQuery({
    queryKey: ['listeners', selectedServer?.id],
    queryFn: () => selectedServer ? api.entities.Listener.filter({ c2_server_id: selectedServer.id, status: 'running' }) : Promise.resolve([]),
    enabled: !!selectedServer
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents', selectedServer?.id],
    queryFn: () => selectedServer ? api.entities.Agent.filter({ c2_server_id: selectedServer.id }) : Promise.resolve([]),
    enabled: !!selectedServer
  });

  const handleGenerateStager = async () => {
    if (!selectedAgent || !selectedListener || !selectedServer) {
      toast.error('Missing configuration');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.functions.invoke('agentStagerGenerator', {
        agent_id: selectedAgent.id,
        c2_server_id: selectedServer.id,
        listener_id: selectedListener.id,
        platform: platform,
        architecture: architecture,
        output_format: outputFormat
      });

      const data = response?.data ?? response;
      setGeneratedStager(data);
      setStep('generated');
      toast.success('Stager generated successfully');
    } catch (error) {
      toast.error(`Generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Stager Generator"
        description="Generate multi-stage agent payloads with custom profiles and delivery methods"
      />

      <Tabs value={step} onValueChange={setStep}>
        <TabsList className="bg-black/40 border border-slate-700 w-full justify-start">
          <TabsTrigger value="select-server">1. Server</TabsTrigger>
          <TabsTrigger value="select-listener" disabled={!selectedServer}>2. Listener</TabsTrigger>
          <TabsTrigger value="select-agent" disabled={!selectedListener}>3. Agent</TabsTrigger>
          <TabsTrigger value="configure" disabled={!selectedAgent}>4. Configure</TabsTrigger>
          <TabsTrigger value="generated" disabled={!generatedStager}>5. Download</TabsTrigger>
        </TabsList>

        {/* Step 1: Select Server */}
        <TabsContent value="select-server" className="space-y-4">
          <Card className="bg-black/40 border-slate-700">
            <CardHeader>
              <CardTitle className="text-base">Select C2 Team Server</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {c2Servers.length === 0 ? (
                <div className="p-4 bg-slate-800/50 rounded border border-slate-700 text-center text-slate-400">
                  No active C2 servers. Create one first in C2 Dashboard.
                </div>
              ) : (
                <div className="space-y-2">
                  {c2Servers.map((server) => (
                    <Card
                      key={server.id}
                      className={`cursor-pointer transition-all ${
                        selectedServer?.id === server.id
                          ? 'border-red-500/50 bg-red-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                      onClick={() => {
                        setSelectedServer(server);
                        setSelectedListener(null);
                        setSelectedAgent(null);
                      }}
                    >
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">{server.name}</p>
                            <p className="text-xs text-slate-400">{server.description}</p>
                          </div>
                          <Badge className="bg-green-900/30 text-green-300">{server.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedServer && (
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => setStep('select-listener')}
            >
              Next: Select Listener
            </Button>
          )}
        </TabsContent>

        {/* Step 2: Select Listener */}
        <TabsContent value="select-listener" className="space-y-4">
          <Card className="bg-black/40 border-slate-700">
            <CardHeader>
              <CardTitle className="text-base">Select Callback Listener</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {listeners.length === 0 ? (
                <div className="p-4 bg-slate-800/50 rounded border border-slate-700 text-center text-slate-400">
                  No running listeners configured for this server.
                </div>
              ) : (
                <div className="space-y-2">
                  {listeners.map((listener) => (
                    <Card
                      key={listener.id}
                      className={`cursor-pointer transition-all ${
                        selectedListener?.id === listener.id
                          ? 'border-red-500/50 bg-red-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                      onClick={() => {
                        setSelectedListener(listener);
                        setSelectedAgent(null);
                      }}
                    >
                      <CardContent className="pt-4 pb-3">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Name</p>
                            <p className="font-semibold text-white">{listener.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Protocol</p>
                            <Badge variant="outline" className="uppercase">{listener.protocol}</Badge>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Address</p>
                            <p className="text-white font-mono text-sm">{listener.host}:{listener.port}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedListener && (
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => setStep('select-agent')}
            >
              Next: Select Agent Profile
            </Button>
          )}
        </TabsContent>

        {/* Step 3: Select Agent */}
        <TabsContent value="select-agent" className="space-y-4">
          <Card className="bg-black/40 border-slate-700">
            <CardHeader>
              <CardTitle className="text-base">Select Agent Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {agents.length === 0 ? (
                <div className="p-4 bg-slate-800/50 rounded border border-slate-700 text-center text-slate-400">
                  No agent profiles configured. Create one in C2 Dashboard.
                </div>
              ) : (
                <div className="space-y-2">
                  {agents.map((agent) => (
                    <Card
                      key={agent.id}
                      className={`cursor-pointer transition-all ${
                        selectedAgent?.id === agent.id
                          ? 'border-red-500/50 bg-red-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                      onClick={() => {
                        setSelectedAgent(agent);
                        setPlatform(agent.platform);
                        setArchitecture(agent.architecture);
                      }}
                    >
                      <CardContent className="pt-4 pb-3">
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Name</p>
                            <p className="font-semibold text-white">{agent.name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Platform</p>
                            <Badge variant="outline" className="capitalize">{agent.platform}</Badge>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Language</p>
                            <p className="text-white font-mono text-sm">{agent.language}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Encryption</p>
                            <Badge variant="outline" className="uppercase text-xs">{agent.encryption}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedAgent && (
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => setStep('configure')}
            >
              Next: Configure & Generate
            </Button>
          )}
        </TabsContent>

        {/* Step 4: Configure */}
        <TabsContent value="configure" className="space-y-4">
          <Card className="bg-black/40 border-slate-700">
            <CardHeader>
              <CardTitle className="text-base">Configure Stager</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="windows">Windows</SelectItem>
                      <SelectItem value="linux">Linux</SelectItem>
                      <SelectItem value="macos">macOS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Architecture</Label>
                  <Select value={architecture} onValueChange={setArchitecture}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="x86">x86</SelectItem>
                      <SelectItem value="x64">x64</SelectItem>
                      <SelectItem value="arm">ARM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Output Format</Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exe">Executable (.exe)</SelectItem>
                      <SelectItem value="dll">DLL (.dll)</SelectItem>
                      <SelectItem value="ps1">PowerShell (.ps1)</SelectItem>
                      <SelectItem value="bin">Raw Binary (.bin)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-400" />
                    Stager Behavior
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-slate-300 space-y-1">
                  <p>• Multi-stage payload (stager → full agent)</p>
                  <p>• Encrypted communication to {selectedListener?.name}</p>
                  <p>• Anti-analysis: {selectedAgent?.anti_analysis ? 'Enabled' : 'Disabled'}</p>
                  <p>• Obfuscation: {selectedAgent?.obfuscation_enabled ? 'Enabled' : 'Disabled'}</p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Button
            className="w-full bg-red-600 hover:bg-red-700 gap-2"
            onClick={handleGenerateStager}
            disabled={isGenerating}
          >
            <Zap className="w-4 h-4" />
            {isGenerating ? 'Generating...' : 'Generate Stager'}
          </Button>
        </TabsContent>

        {/* Step 5: Generated */}
        <TabsContent value="generated" className="space-y-4">
          {generatedStager && (
            <>
              <Card className="border-green-500/50 bg-green-500/10">
                <CardHeader>
                  <CardTitle className="text-green-400">Stager Generated Successfully</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-slate-900 rounded border border-slate-700 font-mono text-xs space-y-1">
                    <p><span className="text-slate-400">Beacon ID:</span> <span className="text-cyan-400">{generatedStager.beacon_id}</span></p>
                    <p><span className="text-slate-400">Format:</span> {generatedStager.format}</p>
                    <p><span className="text-slate-400">Size:</span> {(generatedStager.payload_size_bytes / 1024).toFixed(2)} KB</p>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded border border-slate-700 text-sm space-y-2">
                    <p className="font-semibold text-white">Delivery Instructions:</p>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                      <li>This is a lab check-in profile, not an implant.</li>
                      <li>{generatedStager.instructions?.execution || 'Import the JSON profile in the C2 lab console.'}</li>
                      <li>A beacon record is created so the C2 dashboard can queue lab commands.</li>
                    </ul>
                  </div>

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 gap-2"
                    onClick={() => {
                      const text = generatedStager.profile || JSON.stringify(generatedStager, null, 2);
                      const blob = new Blob([text], { type: 'application/json' });
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = `seraphim-lab-${generatedStager.beacon_id || 'profile'}.json`;
                      a.click();
                      toast.success('Lab profile downloaded');
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Download Stager: {generatedStager.format.toUpperCase()}
                  </Button>
                </CardContent>
              </Card>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep('configure');
                  setGeneratedStager(null);
                }}
              >
                Generate Another
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}