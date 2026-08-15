import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const NMAP_API_URL = Deno.env.get('NMAP_API_URL') || 'https://nmap.online/api/scan';

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
    const { target, profile = 'basic', timeout = 300 } = body;

    if (!target || typeof target !== 'string') {
      return Response.json(
        { error: 'Invalid target: must be IP, hostname, or CIDR range' },
        { status: 400 }
      );
    }

    // Validate target format (basic IP/hostname/CIDR validation)
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    const hostnameRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$|^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

    if (!ipv4Regex.test(target) && !hostnameRegex.test(target)) {
      return Response.json(
        { error: 'Invalid target format' },
        { status: 400 }
      );
    }

    // Map profile to Nmap arguments
    const profileConfig = {
      basic: { args: '-p 80,443,22', name: 'Basic (Common ports)' },
      standard: { args: '-sV -sC', name: 'Standard (Service detection)' },
      deep: { args: '-sV -sC -O --script vuln', name: 'Deep (OS & vulns)' },
      aggressive: { args: '-A -T4', name: 'Aggressive (Full scan)' },
    };

    const config = profileConfig[profile] || profileConfig.basic;

    // Call Nmap API
    const nmapResponse = await fetch(NMAP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target,
        args: config.args,
        timeout: Math.min(timeout, 600),
      }),
    });

    if (!nmapResponse.ok) {
      const errorText = await nmapResponse.text();
      return Response.json(
        { error: 'Nmap API error', details: errorText },
        { status: nmapResponse.status }
      );
    }

    const nmapData = await nmapResponse.json();

    return Response.json({
      success: true,
      scan_id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      target,
      profile,
      status: 'completed',
      started_at: new Date().toISOString(),
      data: nmapData,
      profile_name: config.name,
    });
  } catch (error) {
    return Response.json(
      { error: error.message || 'Scan execution failed' },
      { status: 500 }
    );
  }
});