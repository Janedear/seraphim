import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock data - in production, this would fetch from AlertRule entity
    const rules = [
      {
        id: '1',
        name: 'Critical Incident Alert',
        condition: 'critical_incident_count',
        threshold: '3',
        channels: ['in_app', 'email'],
        enabled: true
      },
      {
        id: '2',
        name: 'Malware Detection',
        condition: 'malware_detected',
        threshold: '1',
        channels: ['in_app', 'slack'],
        enabled: true
      }
    ];

    return Response.json(rules);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});