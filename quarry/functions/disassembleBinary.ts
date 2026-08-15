/**
 * Binary Disassembly - Uses configured disassembler API.
 * Set DISASSEMBLY_API_URL in project secrets for Capstone/Keystone or similar.
 * Falls back to hex + LLM analysis if no API configured.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const DISASSEMBLY_API = Deno.env.get('DISASSEMBLY_API_URL');

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { bytesBase64?: string };
    try {
      body = (await req.json()) || {};
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { bytesBase64 } = body;
    if (!bytesBase64 || bytesBase64.length > 500000) {
      return Response.json({
        error: 'bytesBase64 required (max ~500KB)',
      }, { status: 400 });
    }

    const bytes = Uint8Array.from(atob(bytesBase64), c => c.charCodeAt(0));

    if (DISASSEMBLY_API) {
      const res = await fetch(DISASSEMBLY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bytes: Array.from(bytes), arch: 'x64' }),
      });
      if (res.ok) {
        const data = await res.json();
        return Response.json({
          success: true,
          disassembly: data.disassembly || data.asm || data.output,
          source: 'disassembler_api',
        });
      }
    }

    // Fallback: use LLM to analyze hex dump (no real disassembly, but honest)
    const hexDump = Array.from(bytes)
      .slice(0, 1024)
      .map((b, i) => ((i % 16 === 0 ? '\n' : ' ') + b.toString(16).padStart(2, '0')))
      .join('')
      .trim();

    const prompt = `Analyze this hex dump (first ${Math.min(bytes.length, 1024)} bytes) and provide a best-effort disassembly or structure analysis. If you cannot disassemble, describe the byte patterns you see.

HEX:
${hexDump}

Respond with JSON: { "disassembly": "string (one instruction per line with address)", "notes": "string" }`;

    const aiResponse = await api.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          disassembly: { type: 'string' },
          notes: { type: 'string' },
        },
      },
    });

    return Response.json({
      success: true,
      disassembly: aiResponse?.disassembly || 'Unable to disassemble. Configure DISASSEMBLY_API_URL for real disassembly.',
      notes: aiResponse?.notes || 'LLM-based analysis. For accurate disassembly, set DISASSEMBLY_API_URL to a Capstone/Keystone service.',
      source: 'llm_fallback',
    });
  } catch (error) {
    return Response.json(
      { error: error?.message || 'Disassembly failed' },
      { status: 500 }
    );
  }
});
