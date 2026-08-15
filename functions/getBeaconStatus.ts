import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Support both POST body (from api.functions.invoke) and URL params
    const url = new URL(req.url);
    let beaconId = url.searchParams.get('beacon_id');
    let c2ServerId = url.searchParams.get('c2_server_id');
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        beaconId = beaconId || body?.beacon_id;
        c2ServerId = c2ServerId || body?.c2_server_id;
      } catch {
        // Body parse failed, use URL params only
      }
    }

    const query = {};
    if (beaconId) query.beacon_id = beaconId;
    if (c2ServerId) query.c2_server_id = c2ServerId;

    // Fetch beacons with filters
    const beacons = await api.entities.Beacon.filter(query);

    // Calculate health metrics for each beacon
    const beaconStatus = beacons.map(beacon => {
      const lastCallbackTime = beacon.last_callback ? new Date(beacon.last_callback) : null;
      const now = new Date();
      const secondsSinceCallback = lastCallbackTime ? (now - lastCallbackTime) / 1000 : null;
      
      let health = 'unknown';
      if (beacon.status === 'dead') {
        health = 'dead';
      } else if (secondsSinceCallback !== null && secondsSinceCallback > beacon.sleep_interval * 3) {
        health = 'stale';
      } else if (beacon.status === 'active') {
        health = 'healthy';
      }

      return {
        beacon_id: beacon.beacon_id,
        hostname: beacon.hostname,
        username: beacon.username,
        ip_address: beacon.ip_address,
        process_name: beacon.process_name,
        integrity_level: beacon.integrity_level,
        os_version: beacon.os_version,
        status: beacon.status,
        health: health,
        last_callback: beacon.last_callback,
        callback_count: beacon.callback_count,
        uptime_seconds: secondsSinceCallback
      };
    });

    return Response.json({
      beacons: beaconStatus,
      total: beaconStatus.length,
      healthy: beaconStatus.filter(b => b.health === 'healthy').length,
      stale: beaconStatus.filter(b => b.health === 'stale').length,
      dead: beaconStatus.filter(b => b.health === 'dead').length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});