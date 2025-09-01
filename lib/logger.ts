import callsites from 'callsites';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  level: LogLevel;
  enabled: boolean;
}

const defaultConfig: LoggerConfig = {
  level: 'info',
  enabled: true,
};

const levelOrder: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let config: LoggerConfig = { ...defaultConfig };

export function configureLogger(newConfig: Partial<LoggerConfig>) {
  config = { ...config, ...newConfig };
}

function getCallsiteInfo(depth = 2) {
  const site = callsites()[depth];
  if (!site) return '';
  const file = site.getFileName();
  const line = site.getLineNumber();
  const func = site.getFunctionName();
  return `${file}#${line}#${func}`;
}

function shouldLog(level: LogLevel) {
  return config.enabled && levelOrder[level] >= levelOrder[config.level];
}

function log(level: LogLevel, ...args: any[]) {
  if (!shouldLog(level)) return;
  const prefix = `[${level.toUpperCase()}] ${getCallsiteInfo(3)}`;
  // eslint-disable-next-line no-console
  console.log(prefix, ...args);
}

export const logger = {
  debug: (...args: any[]) => log('debug', ...args),
  info: (...args: any[]) => log('info', ...args),
  warn: (...args: any[]) => log('warn', ...args),
  error: (...args: any[]) => log('error', ...args),
  configure: configureLogger,
};
