import { describe, it, expect } from 'vitest';
import { createLogger, logger } from './monitoring.js';

describe('monitoring', () => {
  it('exports logger with error, warn, info, debug methods', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('createLogger returns logger with level methods', () => {
    const log = createLogger();
    expect(typeof log.error).toBe('function');
    expect(typeof log.warn).toBe('function');
  });
});
