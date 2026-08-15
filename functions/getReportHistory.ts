import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch from Report entity if available
    let reports = [];
    try {
      const ReportEntity = api.entities?.Report;
      if (ReportEntity) {
        const entities = await ReportEntity.list();
        reports = (entities || []).map(r => ({
          id: r.id,
          name: r.name,
          type: r.type,
          generated_at: r.generated_at,
          generated_by: r.generated_by
        })).sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at));
      }
    } catch (err) {
      console.warn('Report history fetch failed:', err.message);
    }

    return Response.json(reports);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});