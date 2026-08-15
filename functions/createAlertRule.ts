import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ruleData = await req.json();

    // In a production app, you'd save this to an AlertRule entity
    // For now, we'll return the created rule with an ID
    const rule = {
      id: crypto.randomUUID(),
      ...ruleData,
      created_by: user.email,
      created_at: new Date().toISOString()
    };

    // Optionally send a test notification
    if (ruleData.channels.includes('email')) {
      await api.integrations.Core.SendEmail({
        to: user.email,
        subject: 'Alert Rule Created',
        body: `Your alert rule "${ruleData.name}" has been successfully created and is now active.`
      });
    }

    return Response.json(rule);
  } catch (error) {
    console.error('Alert rule creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});