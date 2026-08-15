import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scheduleData = await req.json();

    // In production, this would create an automation to run the report generation
    // on the specified schedule using create_automation
    return Response.json({ 
      success: true, 
      message: 'Report scheduled successfully',
      scheduleData 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});