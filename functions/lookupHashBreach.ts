/**
 * Hash Breach Lookup - Uses Have I Been Pwned k-anonymity API (no key required).
 * Checks if a hash appears in known breach databases.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const HIBP_URL = 'https://api.pwnedpasswords.com/range/';

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { hash?: string };
    try {
      body = (await req.json()) || {};
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const hash = body.hash?.trim().toLowerCase();
    if (!hash || !/^[a-f0-9]{40}$/.test(hash)) {
      return Response.json({
        error: 'SHA-1 hash required (40 hex characters). Use SHA-1 of password to check breaches.',
      }, { status: 400 });
    }

    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const res = await fetch(`${HIBP_URL}${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    });

    if (!res.ok) {
      return Response.json({ error: `HIBP API error: ${res.status}` }, { status: res.status });
    }

    const text = await res.text();
    const lines = text.split('\r\n');
    let count = 0;
    for (const line of lines) {
      const [h, c] = line.split(':');
      if (h?.toLowerCase() === suffix) {
        count = parseInt(c || '0', 10);
        break;
      }
    }

    return Response.json({
      success: true,
      pwned: count > 0,
      count,
      message: count > 0
        ? `This hash appears ${count} times in known breaches`
        : 'Hash not found in Have I Been Pwned database',
    });
  } catch (error) {
    return Response.json(
      { error: error?.message || 'Lookup failed' },
      { status: 500 }
    );
  }
});
