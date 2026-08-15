import { describe, expect, it } from 'vitest';
import { detectAiHeuristic } from './functions.js';
import { decodePayload, encodePayload, extractPngText, embedPngText } from './stego.js';

describe('local backend logic', () => {
  it('detects formal AI-like prose vs short human text', () => {
    const ai = detectAiHeuristic('Furthermore, it is important to note that the overall security posture is robust. Moreover, additionally the controls are comprehensive and in conclusion the organization should continue monitoring.');
    const human = detectAiHeuristic("nah I wouldn't click that, looks sketchy. I'm gonna ping Dave.");
    expect(ai.success).toBe(true);
    expect(ai.confidence).toBeGreaterThan(human.confidence);
  });

  it('round-trips whitespace steganography', () => {
    const hidden = 'hello-lab';
    const carrier = encodePayload('whitespace', hidden, '');
    expect(decodePayload('whitespace', carrier, '')).toBe(hidden);
  });

  it('embeds and extracts a carrier payload', () => {
    const encoded = embedPngText(Buffer.from('not-a-png'), 'secret42');
    expect(extractPngText(encoded)).toBe('secret42');
  });

});
