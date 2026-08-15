import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { api } from '@/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Server, Radio, Activity, AlertCircle, Plus, Zap, Monitor, X, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function BeaconConsole({ beacon, c2ServerId, onCommandSent }) {
  const [command, setCommand] = useState('');
  const [commandType, setCommandType] = useState('shell');
  const [sending, setSending] = useState(false);

  const handleExecute = async () => {
    const trimmed = command?.trim();
    if (!trimmed) {
      toast.error('Enter a command');
      return;
    }
    setSending(true);
    try {
      const result = await api.functions.invoke('executeBeaconCommand', {
        beacon_id: beacon.beacon_id,
        c2_server_id: c2ServerId,
        command_type: commandType,
        command: trimmed,
      });
      const data = result?.data ?? result;
      toast.success(data?.message || 'Command queued');
      setCommand('');
      onCommandSent?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to queue command');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="bg-black/40 border-red-500/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-red-400" />
          Agent Console: {beacon.hostname}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="p-3 bg-slate-900 rounded border border-slate-700 text-xs text-slate-300">
            <p>Beacon ID: {beacon.beacon_id}</p>
            <p>User: {beacon.username}@{beacon.hostname}</p>
            <p>Level: {beacon.integrity_level}</p>
          </div>
          <div className="flex gap-2">
            <Select value={commandType} onValueChange={setCommandType}>
              <SelectTrigger className="w-[140px] bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="shell">Shell</SelectItem>
                <SelectItem value="download">Download</SelectItem>
                <SelectItem value="upload">Upload</SelectItem>
                <SelectItem value="screenshot">Screenshot</SelectItem>
                <SelectItem value="keylog">Keylog</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter command (e.g. whoami, hostname)"
              className="flex-1 bg-slate-900 border-slate-700 text-white font-mono text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
            />
            <Button
              onClick={handleExecute}
              disabled={sending || beacon.health !== 'healthy'}
              className="bg-red-600 hover:bg-red-700"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Commands are queued and delivered on next beacon callback. Beacon must be healthy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function C2Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedServer, setSelectedServer] = useState(null);
  const [selectedBeacon, setSelectedBeacon] = useState(null);
  const [showNewServerModal, setShowNewServerModal] = useState(false);
  const [showNewListenerModal, setShowNewListenerModal] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newListenerName, setNewListenerName] = useState('');
  const [newListenerHost, setNewListenerHost] = useState('0.0.0.0');
  const [newListenerPort, setNewListenerPort] = useState('4444');
  const [newListenerProtocol, setNewListenerProtocol] = useState('http');
  const [creatingServer, setCreatingServer] = useState(false);
  const [creatingListener, setCreatingListener] = useState(false);
  const [beaconPage, setBeaconPage] = useState(0);
  const BEACONS_PER_PAGE = 10;

  // Debounced server selection with pagination reset
  const debouncedSetServer = useCallback((server) => {
    setSelectedServer(server);
    setSelectedBeacon(null);
    setBeaconPage(0); // Reset pagination when server changes
  }, []);

  const handleCreateServer = async () => {
    const name = newServerName?.trim() || `C2-Server-${Date.now()}`;
    setCreatingServer(true);
    try {
      await api.entities.C2Server.create({ name, status: 'active' });
      queryClient.invalidateQueries({ queryKey: ['c2_servers'] });
      setShowNewServerModal(false);
      setNewServerName('');
      toast.success('C2 server created');
    } catch (e) {
      toast.error(e?.message || 'Failed to create server');
    } finally {
      setCreatingServer(false);
    }
  };

  const handleCreateListener = async () => {
    if (!selectedServer) return;
    const name = newListenerName?.trim() || `listener-${newListenerPort}`;
    const port = parseInt(newListenerPort, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      toast.error('Invalid port');
      return;
    }
    setCreatingListener(true);
    try {
      await api.entities.Listener.create({
        name,
        host: newListenerHost,
        port,
        protocol: newListenerProtocol,
        c2_server_id: selectedServer.id,
        status: 'running',
      });
      queryClient.invalidateQueries({ queryKey: ['listeners', selectedServer.id] });
      setShowNewListenerModal(false);
      setNewListenerName('');
      setNewListenerPort('4444');
      toast.success('Listener created');
    } catch (e) {
      toast.error(e?.message || 'Failed to create listener');
    } finally {
      setCreatingListener(false);
    }
  };

  // Fetch C2 Servers
  const { data: c2Servers = [], isLoading: serversLoading } = useQuery({
    queryKey: ['c2_servers'],
    queryFn: async () => {
      try {
        return await api.entities.C2Server.filter({ status: 'active' });
      } catch {
        return [];
      }
    }
  });

  // Fetch Listeners with stale time to prevent unnecessary refetches
  const { data: listeners = [] } = useQuery({
    queryKey: ['listeners', selectedServer?.id],
    queryFn: async () => {
      if (!selectedServer) return [];
      try {
        return await api.entities.Listener.filter({ c2_server_id: selectedServer.id });
      } catch {
        return [];
      }
    },
    enabled: !!selectedServer,
    staleTime: 30000
  });

  // Fetch Agents with stale time
  const { data: agents = [] } = useQuery({
    queryKey: ['agents', selectedServer?.id],
    queryFn: async () => {
      if (!selectedServer) return [];
      try {
        return await api.entities.Agent.filter({ c2_server_id: selectedServer.id });
      } catch {
        return [];
      }
    },
    enabled: !!selectedServer,
    staleTime: 30000
  });

  // Fetch Beacons with proper cleanup and memory leak prevention
  const { data: beacons = [], refetch: refetchBeacons } = useQuery({
    queryKey: ['beacons', selectedServer?.id],
    queryFn: async () => {
      if (!selectedServer) return [];
      try {
        const response = await api.functions.invoke('getBeaconStatus', {
          c2_server_id: selectedServer.id
        });
        return response?.data?.beacons || [];
      } catch {
        return [];
      }
    },
    enabled: !!selectedServer,
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 4000,
    // Prevent memory leaks by stopping refetch when component unmounts
    gcTime: 0
  });

  // Calculate stats
  const activeBeacons = beacons.filter(b => b.health === 'healthy').length;
  const totalBeacons = beacons.length;
  const listenerCount = listeners.length;
  const paginatedBeacons = beacons.slice(beaconPage * BEACONS_PER_PAGE, (beaconPage + 1) * BEACONS_PER_PAGE);
  const totalPages = Math.ceil(beacons.length / BEACONS_PER_PAGE);

  return (
    <div className="space-y-6">
      <PageHeader
         title="C2 Command & Control"
         description="Multi-channel C2 team server with agent management"
         actions={
           <Button onClick={() => setShowNewServerModal(true)} className="bg-red-600 hover:bg-red-700 gap-2">
             <Plus className="w-4 h-4" />
             New Server
           </Button>
         }
       />

      {/* New Server Modal */}
      {showNewServerModal && (
        <Card className="bg-red-950/50 border-red-500/50 mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Create New Server</CardTitle>
            <button onClick={() => setShowNewServerModal(false)} className="p-1 hover:bg-red-900/30 rounded">
              <X className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300">Server Name</Label>
              <Input
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                placeholder="C2-Server-01"
                className="mt-1 bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <Button onClick={handleCreateServer} disabled={creatingServer} className="w-full bg-red-600 hover:bg-red-700">
              {creatingServer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Server
            </Button>
          </CardContent>
        </Card>
      )}

      {/* New Listener Modal */}
      {showNewListenerModal && selectedServer && (
        <Card className="bg-red-950/50 border-red-500/50 mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Create New Listener</CardTitle>
            <button onClick={() => setShowNewListenerModal(false)} className="p-1 hover:bg-red-900/30 rounded">
              <X className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-300">Name</Label>
              <Input value={newListenerName} onChange={(e) => setNewListenerName(e.target.value)} placeholder="http-4444" className="mt-1 bg-slate-900 border-slate-700 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Host</Label>
                <Input value={newListenerHost} onChange={(e) => setNewListenerHost(e.target.value)} placeholder="0.0.0.0" title="0.0.0.0 binds to all interfaces (listen on all IPs)" className="mt-1 bg-slate-900 border-slate-700 text-white" />
              </div>
              <div>
                <Label className="text-slate-300">Port</Label>
                <Input value={newListenerPort} onChange={(e) => setNewListenerPort(e.target.value)} type="number" min="1" max="65535" className="mt-1 bg-slate-900 border-slate-700 text-white" />
              </div>
            </div>
            <div>
              <Label className="text-slate-300">Protocol</Label>
              <Select value={newListenerProtocol} onValueChange={setNewListenerProtocol}>
                <SelectTrigger className="mt-1 bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="http">HTTP</SelectItem>
                  <SelectItem value="https">HTTPS</SelectItem>
                  <SelectItem value="tcp">TCP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateListener} disabled={creatingListener} className="w-full bg-red-600 hover:bg-red-700">
              {creatingListener ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Listener
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Server Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {c2Servers.length === 0 && !serversLoading && (
          <Card className="col-span-full bg-black/40 border-slate-700">
            <CardContent className="py-12 text-center">
              <Server className="w-12 h-12 mx-auto mb-3 text-slate-500" />
              <p className="text-slate-400">No C2 servers yet</p>
              <p className="text-xs text-slate-500 mt-1">Click "New Server" to create one</p>
            </CardContent>
          </Card>
        )}
        {c2Servers.map((server) => (
            <Card
              key={server.id}
              className={`cursor-pointer transition-all ${
                selectedServer?.id === server.id
                  ? 'border-red-500/50 bg-red-500/10'
                  : 'border-slate-700 hover:border-red-500/30'
              }`}
              onClick={() => debouncedSetServer(server)}
            >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Server className="w-4 h-4" />
                {server.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Listeners:</span>
                <span className="text-white font-bold">{server.listener_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Beacons:</span>
                <span className="text-white font-bold">{server.active_beacons || 0}</span>
              </div>
              <Badge className="w-full justify-center bg-green-900/30 text-green-300 border-green-700">
                {server.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedServer && (
        <div key={selectedServer.id}>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-black/40 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Active Beacons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-400">{activeBeacons}</div>
                <p className="text-xs text-slate-500 mt-1">of {totalBeacons} total</p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Listeners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-cyan-400">{listenerCount}</div>
                <p className="text-xs text-slate-500 mt-1">running</p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Agent Profiles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-400">{agents.length}</div>
                <p className="text-xs text-slate-500 mt-1">configured</p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Last Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-300">
                  {selectedServer?.last_activity ? new Date(selectedServer.last_activity).toLocaleTimeString() : 'Never'}
                </div>
                <p className="text-xs text-slate-500 mt-1">today</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="beacons" className="space-y-4">
            <TabsList className="bg-black/40 border border-slate-700">
              <TabsTrigger value="beacons" className="gap-2">
                <Activity className="w-4 h-4" />
                Active Beacons ({activeBeacons})
              </TabsTrigger>
              <TabsTrigger value="listeners" className="gap-2">
                <Radio className="w-4 h-4" />
                Listeners ({listenerCount})
              </TabsTrigger>
              <TabsTrigger value="agents" className="gap-2">
                <Zap className="w-4 h-4" />
                Agent Profiles ({agents.length})
              </TabsTrigger>
            </TabsList>

            {/* Beacons Tab */}
            <TabsContent value="beacons" className="space-y-4">
              {beacons.length === 0 ? (
                <Card className="bg-black/40 border-slate-700">
                  <CardContent className="py-8 text-center">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                    <p className="text-slate-400">No active beacons</p>
                    <p className="text-xs text-slate-500 mt-1">Deploy agents to establish callbacks</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedBeacons.map((beacon) => (
                      <Card
                        key={beacon.beacon_id}
                        className={`bg-black/40 border cursor-pointer ${
                          selectedBeacon?.beacon_id === beacon.beacon_id
                            ? 'border-red-500/50'
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                        onClick={() => setSelectedBeacon(beacon)}
                      >
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="truncate">
                              <p className="text-slate-400 text-xs mb-1">Hostname</p>
                              <p className="text-white font-mono truncate">{beacon.hostname || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs mb-1">User</p>
                              <p className="text-white font-mono">{beacon.username || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs mb-1">IP</p>
                              <p className="text-white font-mono text-xs">{beacon.ip_address || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs mb-1">Status</p>
                              <Badge className={
                                beacon.health === 'healthy' ? 'bg-green-900/30 text-green-300' :
                                beacon.health === 'stale' ? 'bg-yellow-900/30 text-yellow-300' :
                                'bg-red-900/30 text-red-300'
                              }>
                                {beacon.health || 'unknown'}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400">
                            <p>Callbacks: {beacon.callback_count || 0} | Last: {beacon.last_callback ? new Date(beacon.last_callback).toLocaleTimeString() : 'Never'}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex gap-2 justify-center mt-4">
                      <Button variant="outline" onClick={() => setBeaconPage(Math.max(0, beaconPage - 1))} disabled={beaconPage === 0}>
                        Previous
                      </Button>
                      <span className="text-slate-400 text-sm flex items-center px-2">
                        Page {beaconPage + 1} of {totalPages}
                      </span>
                      <Button variant="outline" onClick={() => setBeaconPage(Math.min(totalPages - 1, beaconPage + 1))} disabled={beaconPage === totalPages - 1}>
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Listeners Tab */}
             <TabsContent value="listeners" className="space-y-4">
               <Button className="w-full bg-red-600 hover:bg-red-700 gap-2" variant="default" onClick={() => setShowNewListenerModal(true)}>
                 <Plus className="w-4 h-4" />
                 New Listener
               </Button>
              {listeners.length === 0 ? (
                <Card className="bg-black/40 border-slate-700">
                  <CardContent className="py-8 text-center">
                    <Radio className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                    <p className="text-slate-400">No listeners configured</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {listeners.map((listener) => (
                    <Card key={listener.id} className="bg-black/40 border-slate-700">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Name</p>
                            <p className="text-white font-mono">{listener.name}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Protocol</p>
                            <p className="text-white uppercase font-bold">{listener.protocol}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Address</p>
                            <p className="text-white font-mono text-xs">{listener.host}:{listener.port}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Beacons</p>
                            <p className="text-white font-bold">{listener.beacon_count}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Status</p>
                            <Badge className="bg-green-900/30 text-green-300">
                              {listener.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Agents Tab */}
             <TabsContent value="agents" className="space-y-4">
               <Button className="w-full bg-red-600 hover:bg-red-700 gap-2" variant="default" asChild>
                 <Link to={createPageUrl('AgentBuilder')}>
                   <Plus className="w-4 h-4" />
                   Generate Agent
                 </Link>
               </Button>
              {agents.length === 0 ? (
                <Card className="bg-black/40 border-slate-700">
                  <CardContent className="py-8 text-center">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                    <p className="text-slate-400">No agent profiles</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {agents.map((agent) => (
                    <Card key={agent.id} className="bg-black/40 border-slate-700">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Name</p>
                            <p className="text-white font-mono">{agent.name}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Platform</p>
                            <Badge variant="outline" className="capitalize">{agent.platform}</Badge>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Architecture</p>
                            <p className="text-white font-mono">{agent.architecture}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Language</p>
                            <p className="text-white capitalize">{agent.language}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs mb-1">Status</p>
                            <Badge className="capitalize bg-blue-900/30 text-blue-300">
                              {agent.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Beacon Console */}
          {selectedBeacon && (
            <BeaconConsole
              beacon={selectedBeacon}
              c2ServerId={selectedServer.id}
              onCommandSent={() => refetchBeacons()}
            />
          )}
        </div>
      )}
    </div>
  );
}