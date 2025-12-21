import pino from 'pino';

// Create structured logger with production-ready configuration
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'DATABASE_URL',
      'SESSION_SECRET'
    ],
    censor: '[REDACTED]'
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'HH:MM:ss'
      }
    }
  })
});

// Request ID middleware for tracing
export function requestIdMiddleware(req: any, res: any, next: any) {
  req.id = req.headers['x-request-id'] || Math.random().toString(36).substr(2, 9);
  res.setHeader('X-Request-ID', req.id);
  next();
}

// Express-compatible logging middleware
export function requestLoggingMiddleware(req: any, res: any, next: any) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      req: {
        id: req.id,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent']
      },
      res: {
        statusCode: res.statusCode
      },
      duration
    };

    if (res.statusCode >= 400) {
      logger.warn(logData, 'HTTP request completed with error');
    } else {
      logger.info(logData, 'HTTP request completed');
    }
  });
  
  next();
}