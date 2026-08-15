/**
 * Assembly Analysis - Uses the Seraphim LLM to analyze x86/x64 assembly code.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const api = createClientFromRequest(req);
    const user = await api.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { asmCode?: string };
    try {
      body = (await req.json()) || {};
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const asmCode = body.asmCode?.trim();
    if (!asmCode || asmCode.length > 20000) {
      return Response.json(
        { error: 'asmCode is required and must be 1-20000 characters' },
        { status: 400 }
      );
    }

    const prompt = `You are a reverse engineering expert. Analyze the following x86/x64 assembly code.

ASSEMBLY CODE:
"""
${asmCode}
"""

Respond with valid JSON only, no markdown:
{
  "instructions": [
    {
      "code": "exact instruction as in input",
      "mnemonic": "MNEMONIC (Brief description)",
      "beginner": "Simple explanation",
      "intermediate": "Technical explanation",
      "advanced": "Deep technical/security analysis",
      "warning": "Potential pitfall or null",
      "security": "Security implication or null"
    }
  ],
  "patterns": [
    { "name": "string", "description": "string", "startLine": number, "endLine": number }
  ],
  "summary": {
    "purpose": "string",
    "parameters": "string",
    "returnType": "string",
    "optimizations": "string",
    "vulnerabilities": ["string"]
  }
}`;

    const aiResponse = await api.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          instructions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                mnemonic: { type: 'string' },
                beginner: { type: 'string' },
                intermediate: { type: 'string' },
                advanced: { type: 'string' },
                warning: { type: ['string', 'null'] },
                security: { type: ['string', 'null'] },
              },
            },
          },
          patterns: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                startLine: { type: 'number' },
                endLine: { type: 'number' },
              },
            },
          },
          summary: {
            type: 'object',
            properties: {
              purpose: { type: 'string' },
              parameters: { type: 'string' },
              returnType: { type: 'string' },
              optimizations: { type: 'string' },
              vulnerabilities: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    });

    return Response.json({
      success: true,
      instructions: aiResponse?.instructions || [],
      patterns: aiResponse?.patterns || [],
      summary: aiResponse?.summary || {},
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error?.message || 'Analysis failed' },
      { status: 500 }
    );
  }
});
