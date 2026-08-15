/**
 * Recon Lookup - Real WHOIS, DNS, Subdomain, SSL lookups via HackerTarget API.
 * Server-side proxy to avoid CORS; uses free public API (rate limited).
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const HACKERTARGET_BASE = Deno.env.get('HACKERTARGET_BASE') || 'https://api.hackertarget.com';

const sanitizeDomain = (input: string): string => {
  const trimmed = (input || '').trim().toLowerCase();
  // Allow domain format: example.com, sub.example.com. Reject invalid chars.
  if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(trimmed) && !/^[a-z0-9.-]+$/.test(trimmed)) {
    throw new Error('Invalid domain format');
  }
  return trimmed;
};

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { type?: string; target?: string };
    try {
      body = (await req.json()) || {};
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { type, target } = body;
    if (!type || !target) {
      return Response.json({ error: 'Missing type or target' }, { status: 400 });
    }

    const domain = sanitizeDomain(target);
    let url: string;

    switch (type) {
      case 'whois':
        url = `${HACKERTARGET_BASE}/whois/?q=${encodeURIComponent(domain)}`;
        break;
      case 'dns':
        url = `${HACKERTARGET_BASE}/dnslookup/?q=${encodeURIComponent(domain)}`;
        break;
      case 'subdomain':
        url = `${HACKERTARGET_BASE}/hostsearch/?q=${encodeURIComponent(domain)}`;
        break;
      case 'ssl':
        url = `${HACKERTARGET_BASE}/sslcertinfo/?q=${encodeURIComponent(domain)}`;
        break;
      default:
        return Response.json({ error: 'Invalid type. Use: whois, dns, subdomain, ssl' }, { status: 400 });
    }

    const res = await fetch(url);
    const text = await res.text();

    if (!res.ok) {
      return Response.json({
        success: false,
        error: `API error: ${res.status}`,
        data: text.slice(0, 500),
      });
    }

    return Response.json({
      success: true,
      type,
      target: domain,
      data: text,
    });
  } catch (error) {
    const errMsg = error?.message || String(error);
    if (typeof console !== 'undefined') {
      console.error(JSON.stringify({ type: 'recon_lookup_error', message: errMsg, timestamp: new Date().toISOString() }));
    }
    return Response.json({
      success: false,
      error: error?.message || 'Lookup failed',
    }, { status: 500 });
  }
});
