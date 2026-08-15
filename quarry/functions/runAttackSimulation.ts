/**
 * Run Attack Simulation - Executes real security tests via configured framework.
 * Set ATTACK_SIMULATION_API_URL and ATTACK_SIMULATION_API_KEY in project secrets.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const API_URL = Deno.env.get('ATTACK_SIMULATION_API_URL');
const API_KEY = Deno.env.get('ATTACK_SIMULATION_API_KEY');

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { simulationType?: string; target?: string; intensity?: string };
    try {
      body = (await req.json()) || {};
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { simulationType, target, intensity = 'medium' } = body;
    if (!simulationType) {
      return Response.json({ error: 'simulationType is required' }, { status: 400 });
    }

    if (!API_URL || !API_KEY) {
      return Response.json({
        error: 'Attack simulation not configured. Set ATTACK_SIMULATION_API_URL and ATTACK_SIMULATION_API_KEY in project function secrets.',
        configured: false,
      }, { status: 503 });
    }

    const response = await fetch(`${API_URL}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        simulation_type: simulationType,
        target: target || null,
        intensity,
        initiated_by: user.email,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return Response.json({
        error: `Simulation API error: ${response.status}`,
        details: errText.slice(0, 500),
      }, { status: response.status });
    }

    const data = await response.json();
    return Response.json({
      success: true,
      simulation_id: data.id || crypto.randomUUID(),
      status: data.status || 'running',
      results: data.results || null,
    });
  } catch (error) {
    return Response.json(
      { error: error?.message || 'Simulation failed' },
      { status: 500 }
    );
  }
});
