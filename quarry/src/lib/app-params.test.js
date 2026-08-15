import { describe, it, expect } from 'vitest';
import { validateConfig, appParams } from './app-params.js';

describe('app-params', () => {
  it('exports appParams with expected shape', () => {
    expect(appParams).toBeDefined();
    expect(appParams).toHaveProperty('appId');
    expect(appParams).toHaveProperty('appBaseUrl');
    expect(appParams).toHaveProperty('token');
  });

  it('validateConfig rejects empty appId', () => {
    const result = validateConfig({ appId: '', appBaseUrl: 'https://app.example.com' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('App ID is required');
  });

  it('validateConfig rejects invalid appId characters', () => {
    const result = validateConfig({ appId: 'bad@id!', appBaseUrl: 'https://app.example.com' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('invalid'))).toBe(true);
  });

  it('validateConfig accepts valid config', () => {
    const result = validateConfig({
      appId: 'test-app-123',
      appBaseUrl: 'https://app.example.com',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validateConfig rejects invalid URL', () => {
    const result = validateConfig({
      appId: 'test-app',
      appBaseUrl: 'not-a-valid-url',
    });
    expect(result.valid).toBe(false);
  });
});
