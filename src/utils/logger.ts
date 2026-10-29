/**
 * Minimal logger. In development it writes to the console with a tag so
 * swallowed failures (notifications, haptics, best-effort writes) stay
 * visible while debugging; in production it is silent. A crash reporter can
 * be hooked in here later without touching call sites.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

function emit(level: Level, scope: string, message: string, detail?: unknown): void {
  if (!__DEV__) return;
  const line = `[${scope}] ${message}`;
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (detail === undefined) sink(line);
  else sink(line, detail);
}

export function createLogger(scope: string): {
  debug: (message: string, detail?: unknown) => void;
  info: (message: string, detail?: unknown) => void;
  warn: (message: string, detail?: unknown) => void;
  error: (message: string, detail?: unknown) => void;
} {
  return {
    debug: (message, detail) => emit('debug', scope, message, detail),
    info: (message, detail) => emit('info', scope, message, detail),
    warn: (message, detail) => emit('warn', scope, message, detail),
    error: (message, detail) => emit('error', scope, message, detail),
  };
}
