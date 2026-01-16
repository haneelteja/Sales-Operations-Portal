// Centralized logging utility
// Replace console statements with this for better control

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

// Lazy initialization to prevent circular dependency issues
let loggerInstance: Logger | null = null;

function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger(
      import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO
    );
  }
  return loggerInstance;
}

// Export logger instance (lazy getter)
export const logger = new Proxy({} as Logger, {
  get(_target, prop) {
    return getLogger()[prop as keyof Logger];
  }
});

// Export individual methods using lazy getters
export const error = (...args: Parameters<Logger['error']>) => getLogger().error(...args);
export const warn = (...args: Parameters<Logger['warn']>) => getLogger().warn(...args);
export const info = (...args: Parameters<Logger['info']>) => getLogger().info(...args);
export const debug = (...args: Parameters<Logger['debug']>) => getLogger().debug(...args);

