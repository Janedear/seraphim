import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    body = body || {};
    const { deviceType, version, apps, extensions, team } = body;

    const context = team === 'blue'
      ? 'defensive security assessment to protect infrastructure and prioritize remediation'
      : 'offensive security assessment to identify exploitation opportunities for authorized penetration testing';

    const appsList = apps?.length ? apps.join(', ') : 'none specified';
    const extensionsList = extensions?.length ? extensions.join(', ') : 'none specified';

    // Use AI with internet context to fetch real vulnerability data
    const vulnData = await api.integrations.Core.InvokeLLM({
      prompt: `You are an expert cybersecurity vulnerability analyst for Seraphim performing a ${context}.

TARGET ENVIRONMENT:
- Device Type: ${deviceType}
- Version/OS: ${version || 'latest'}
- Installed Applications: ${appsList}
- Browser Extensions: ${extensionsList}

RESEARCH REQUIREMENTS (use current CVE databases, NVD, vendor advisories, exploit-db, and threat intel):
1. Known CVEs: Include CVE ID, title, CVSS score (0-10), severity (critical/high/medium/low), affected component, and whether public exploits exist
2. Configuration weaknesses: Common misconfigurations for this stack
3. Supply chain risks: Vulnerable dependencies or third-party components
4. Exploitability: For each CVE, note if PoC/exploit code is publicly available

OUTPUT FOCUS:
${team === 'blue'
  ? 'BLUE TEAM: Prioritize risk assessment, patch availability, mitigation steps, hardening recommendations, and detection signatures. Order by business impact.'
  : 'RED TEAM: Prioritize exploitability, attack vectors, entry points, and tactical pentest recommendations. Order by ease of exploitation.'}

Return structured, actionable intelligence. Use real CVE IDs when available (prefer NVD format). If no recent CVEs exist for the exact version, note "No critical CVEs found for exact version" and provide related/adjacent vulnerabilities. Prioritize exploitable issues. Be concise; avoid filler content.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          device_info: { 
            type: 'object',
            properties: {
              type: { type: 'string' },
              version: { type: 'string' },
              risk_score: { type: 'number' },
              overall_assessment: { type: 'string' }
            }
          },
          vulnerabilities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                cve_id: { type: 'string' },
                title: { type: 'string' },
                severity: { type: 'string' },
                cvss_score: { type: 'number' },
                description: { type: 'string' },
                exploit_available: { type: 'boolean' },
                affected_component: { type: 'string' },
                remediation: { type: 'string' }
              }
            }
          },
          apps_analysis: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                vulnerabilities_count: { type: 'number' },
                risk_level: { type: 'string' },
                issues: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          extensions_analysis: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                permissions_risk: { type: 'string' },
                known_issues: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          recommendations: {
            type: 'array',
            items: { type: 'string' }
          },
          attack_vectors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                vector: { type: 'string' },
                likelihood: { type: 'string' },
                impact: { type: 'string' }
              }
            }
          }
        }
      }
    });

    return Response.json(vulnData);
  } catch (error) {
    console.error('Vulnerability scan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});