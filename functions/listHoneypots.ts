/**
 * List Honeypots - Returns honeypots from Honeypot entity.
 * Create honeypots in Seraphim or integrate with T-Pot/Cowrie/MHN.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const Entity = api.entities?.Honeypot;
    if (!Entity) {
      return Response.json({
        success: true,
        honeypots: [],
        message: 'Honeypot entity not configured. Add the entity in Seraphim or integrate with T-Pot/MHN.',
      });
    }

    const honeypots = (await Entity.list()) || [];

    return Response.json({
      success: true,
      honeypots: honeypots.map((h: Record<string, unknown>) => ({
        id: h.id,
        name: h.name,
        type: h.type,
        port: h.port,
        status: h.status,
        interactions: h.interactions ?? 0,
        dataCaptured: h.data_captured ?? h.dataCaptured ?? '0',
        attackers: h.attacker_count ?? h.attackers ?? 0,
        lastActivity: h.last_activity ?? h.lastActivity ?? 'Never',
      })),
    });
  } catch (error) {
    return Response.json(
      { error: error?.message || 'Failed to list honeypots' },
      { status: 500 }
    );
  }
});
