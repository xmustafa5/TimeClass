import { env } from './env.js';

// Pino logger configuration for Fastify
export const loggerConfig = {
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
};

// Disable logging during tests
export const getLoggerConfig = () => {
  if (env.NODE_ENV === 'test') {
    return false;
  }
  return loggerConfig;
};
