const LOG_LEVELS = ['debug', 'info', 'warn', 'error'];

const logImpl = (level, payload) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    ...(typeof payload === 'object' ? payload : { message: String(payload) }),
  };
  if (level === 'error') {
    console.error('[Seraphim]', entry);
  } else if (level === 'warn') {
    console.warn('[Seraphim]', entry);
  } else {
    console.log('[Seraphim]', entry);
  }
  if (typeof window !== 'undefined' && window.__SERAPHIM_APM__) {
    try {
      window.__SERAPHIM_APM__(level, entry);
    } catch {
      /* swallow APM failures */
    }
  }
};

export const createLogger = () => {
  const logger = (level, payload) => {
    if (LOG_LEVELS.includes(level)) {
      logImpl(level, payload);
    }
  };
  LOG_LEVELS.forEach((level) => {
    logger[level] = (payload) => logImpl(level, payload);
  });
  return logger;
};

export const logger = createLogger();

export const installGlobalErrorHandler = () => {
  if (typeof window === 'undefined') return;

  const handleError = (event) => {
    logger.error({
      type: 'uncaught_error',
      message: event?.message,
      filename: event?.filename,
      lineno: event?.lineno,
    });
  };

  const handleRejection = (event) => {
    logger.error({
      type: 'unhandled_rejection',
      reason: event?.reason?.message ?? String(event?.reason),
    });
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleRejection);

  window.__SERAPHIM_LOG__ = logger;

  return () => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleRejection);
  };
};
