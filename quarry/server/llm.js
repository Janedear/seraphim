import { llmKeyPresent } from './env.js';

export { llmKeyPresent };

function firstKey() {
  return process.env.OPENAI_API_KEY || process.env.CURSOR_API_KEY || process.env.ANTHROPIC_API_KEY || '';
}

export async function invokeLlm({ prompt, json = true }) {
  const key = firstKey();
  if (!key) return null;

  const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: json ? 'Reply with valid JSON only.' : 'You are a cybersecurity analyst for Seraphim.' },
          { role: 'user', content: prompt },
        ],
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    if (!res.ok) return null;
    const payload = await res.json();
    const text = payload.choices?.[0]?.message?.content || '';
    if (!json) return text;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}
