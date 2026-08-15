import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let reportType = 'daily-summary';
    let timeframe = '24h';
    try {
      const body = await req.json();
      if (body && typeof body === 'object') {
        reportType = body.reportType || reportType;
        timeframe = body.timeframe || timeframe;
      }
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Fetch relevant data based on report type
    const alerts = (await api.entities.Alert.list()) || [];
    const incidents = (await api.entities.Incident.list()) || [];
    const devices = (await api.entities.Device.list()) || [];

    // Build AI prompt based on report type
    const openIncidents = (incidents || []).filter(i => i && ['open', 'in_progress', 'new'].includes(i.status));
    const criticalAlerts = (alerts || []).filter(a => a && a.severity === 'critical');
    const highAlerts = (alerts || []).filter(a => a && a.severity === 'high');

    let prompt = '';
    switch (reportType) {
      case 'daily-summary':
        prompt = `You are a senior cybersecurity analyst for Seraphim. Generate a concise, actionable daily security summary report for the timeframe: ${timeframe}.

DATA PROVIDED:
- Total alerts: ${alerts.length}
- Critical alerts: ${criticalAlerts.length}
- High alerts: ${highAlerts.length}
- Active/open incidents: ${openIncidents.length}
- Devices monitored: ${devices.length}
- Online devices: ${(devices || []).filter(d => d && d.status === 'online').length}

REQUIRED OUTPUT STRUCTURE (JSON):
1. title: Brief report title
2. executive_summary: 2-3 sentences summarizing overall security posture and any urgent concerns
3. key_metrics: Array of {metric, value, trend} objects (e.g., critical_alerts, mean_time_to_detect)
4. findings: Array of top 3-5 most critical findings with clear severity
5. recommendations: Array of prioritized, actionable next steps (specific, not generic)
6. conclusion: Brief closing statement

Be specific, professional, and actionable. Use security industry terminology. Avoid generic advice; reference the actual metrics provided.`;
        break;
      case 'weekly-incidents':
        prompt = `You are a senior incident response analyst for Seraphim. Generate a comprehensive weekly incident review report (timeframe: ${timeframe}).

DATA: ${incidents.length} total incidents analyzed. Severity breakdown: ${JSON.stringify(
          (incidents || []).filter(i => i).reduce((acc, i) => { acc[i.severity] = (acc[i.severity] || 0) + 1; return acc; }, {})
        )}

REQUIRED OUTPUT STRUCTURE (JSON):
1. title: Report title
2. executive_summary: Overview of incident trends and response effectiveness
3. key_metrics: Incident volume, mean time to detect (MTTD), mean time to respond (MTTR), resolution rate
4. findings: Common attack patterns, MITRE tactics observed, lessons learned
5. recommendations: Process improvements, detection rule gaps, training needs
6. conclusion: Strategic takeaways for next week

Be analytical and evidence-based. Reference specific incident patterns where applicable. Quantify trends when possible.`;
        break;
      case 'monthly-threat':
        prompt = `You are a threat intelligence analyst for Seraphim. Generate a monthly threat landscape analysis report (timeframe: ${timeframe}).

DATA: ${alerts.length} alerts, ${incidents.length} incidents across ${devices.length} endpoints.
Top MITRE tactics from alerts: ${JSON.stringify(
          Object.entries((alerts || []).filter(a => a).reduce((acc, a) => {
            if (a.mitre_tactic) acc[a.mitre_tactic] = (acc[a.mitre_tactic] || 0) + 1;
            return acc;
          }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, c]) => `${t}: ${c}`).join(', ')
        )}

REQUIRED OUTPUT STRUCTURE (JSON):
1. title: Report title
2. executive_summary: Threat landscape overview and key trends
3. key_metrics: Threat actor activity, TTP evolution, industry benchmarks
4. findings: Emerging threats, vulnerability trends, supply chain risks
5. recommendations: Strategic recommendations for next month (detection, hardening, training)
6. conclusion: Forward-looking threat assessment

Incorporate industry threat intelligence context. Be strategic and actionable. Cite MITRE ATT&CK where relevant.`;
        break;
      case 'compliance':
        prompt = `You are a security compliance auditor for Seraphim. Generate a compliance audit report (timeframe: ${timeframe}).

DATA:
- Device coverage: ${devices.length} endpoints
- Online/protected: ${(devices || []).filter(d => d && d.status === 'online').length}
- Policies in use: ${new Set((devices || []).filter(d => d).map(d => d.policy_id).filter(Boolean)).size}
- Critical/high alerts this period: ${criticalAlerts.length + highAlerts.length}

REQUIRED OUTPUT STRUCTURE (JSON):
1. title: Report title
2. executive_summary: Compliance posture overview
3. key_metrics: Coverage rate, policy adherence, gap areas
4. findings: Compliance gaps, control effectiveness, audit findings
5. recommendations: Prioritized remediation with timelines
6. conclusion: Overall compliance assessment

Align with common frameworks (NIST, CIS, ISO 27001) where relevant. Be specific about gaps and cite control IDs when applicable.`;
        break;
      default:
        prompt = `You are a cybersecurity analyst. Generate a general security status report.

DATA: ${alerts.length} alerts, ${incidents.length} incidents, ${devices.length} devices.

REQUIRED OUTPUT STRUCTURE (JSON):
1. title, 2. executive_summary, 3. key_metrics, 4. findings, 5. recommendations, 6. conclusion.
Be professional and actionable.`;
    }

    // Use AI to generate the report
    const aiResponse = await api.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          executive_summary: { type: 'string' },
          key_metrics: { type: 'array', items: { type: 'object' } },
          findings: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
          conclusion: { type: 'string' }
        }
      }
    });

    const report = {
      id: crypto.randomUUID(),
      name: aiResponse?.title || `Security Report - ${reportType}`,
      type: reportType,
      content: aiResponse,
      generated_at: new Date().toISOString(),
      generated_by: user.email
    };

    // Persist to Report entity if available (for getReportHistory)
    try {
      const ReportEntity = api.entities?.Report;
      if (ReportEntity) {
        await ReportEntity.create({
          id: report.id,
          name: report.name,
          type: reportType,
          content: report.content,
          generated_at: report.generated_at,
          generated_by: user.email
        });
      }
    } catch (persistErr) {
      console.warn('Report persist skipped:', persistErr.message);
    }

    return Response.json(report);
  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});