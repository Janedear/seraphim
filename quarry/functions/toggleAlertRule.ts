import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ruleId, enabled } = await req.json();

    // In production, update AlertRule entity
    return Response.json({ success: true, ruleId, enabled });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});