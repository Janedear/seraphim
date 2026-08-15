/**
 * List Phishing Campaigns - Returns campaigns from PhishingCampaign entity.
 * Create campaigns in Seraphim or API.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const Entity = api.entities?.PhishingCampaign;
    if (!Entity) {
      return Response.json({
        success: true,
        campaigns: [],
        templates: [],
        message: 'PhishingCampaign entity not configured. Add the PhishingCampaign entity in Seraphim to manage campaigns.',
      });
    }

    const campaigns = (await Entity.list()) || [];
    const templates = (await api.entities?.PhishingTemplate?.list?.()) || [];

    return Response.json({
      success: true,
      campaigns: campaigns.map((c: Record<string, unknown>) => ({
        id: c.id,
        name: c.name,
        template: c.template_name || c.template,
        status: c.status,
        sent: c.sent_count ?? c.sent ?? 0,
        total: c.total_count ?? c.total ?? 0,
        opened: c.opened_count ?? c.opened ?? 0,
        clicked: c.clicked_count ?? c.clicked ?? 0,
      })),
      templates: templates.map((t: Record<string, unknown>) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        difficulty: t.difficulty || 'medium',
      })),
    });
  } catch (error) {
    return Response.json(
      { error: error?.message || 'Failed to list campaigns' },
      { status: 500 }
    );
  }
});
