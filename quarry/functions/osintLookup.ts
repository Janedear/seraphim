/**
 * OSINT Lookup - Uses AbuseIPDB for IP/attacker intelligence.
 * Set ABUSEIPDB_API_KEY in project function secrets. Free tier: 1000 req/day.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const API_KEY = Deno.env.get('ABUSEIPDB_API_KEY');
const API_URL = 'https://api.abuseipdb.com/api/v2/check';

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { query?: string; type?: string };
    try {
      body = (await req.json()) || {};
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { query, type = 'ip' } = body;
    if (!query?.trim()) {
      return Response.json({ error: 'query is required' }, { status: 400 });
    }

    if (!API_KEY) {
      return Response.json({
        error: 'OSINT not configured. Set ABUSEIPDB_API_KEY in project function secrets. Get a free key at abuseipdb.com.',
        configured: false,
      }, { status: 503 });
    }

    const trimmed = query.trim();

    // Validate IP format
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(trimmed)) {
      return Response.json({
        error: 'AbuseIPDB supports IPv4 only. Provide a valid IP address.',
      }, { status: 400 });
    }

    const res = await fetch(`${API_URL}?ipAddress=${encodeURIComponent(trimmed)}&maxAgeInDays=90`, {
      headers: {
        'Key': API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({
        error: `AbuseIPDB error: ${res.status}`,
        details: err.slice(0, 300),
      }, { status: res.status });
    }

    const data = await res.json();
    const d = data.data || {};

    return Response.json({
      success: true,
      query: trimmed,
      abuseConfidenceScore: d.abuseConfidenceScore ?? 0,
      totalReports: d.totalReports ?? 0,
      country: d.countryCode,
      usageType: d.usageType,
      isp: d.isp,
      domain: d.domain,
      reportedAt: d.lastReportedAt,
      categories: d.reports?.map((r: { categories: string[] }) => r.categories)?.flat() || [],
    });
  } catch (error) {
    return Response.json(
      { error: error?.message || 'OSINT lookup failed' },
      { status: 500 }
    );
  }
});
