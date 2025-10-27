interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: any;
  error?: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatLog(level: string, message: string, context?: any, error?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
      ...(error && { error: error.message || error })
    };
  }

  private log(level: string, message: string, context?: any, error?: any) {
    const logEntry = this.formatLog(level, message, context, error);
    
    if (this.isDevelopment) {
      // Em desenvolvimento, usar console com cores
      const colors = {
        error: '\x1b[31m',
        warn: '\x1b[33m',
        info: '\x1b[36m',
        debug: '\x1b[90m',
        reset: '\x1b[0m'
      };
      
      const color = colors[level as keyof typeof colors] || colors.reset;
      console.log(`${color}[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}${colors.reset}`);
      
      if (context) console.log('Context:', context);
      if (error) console.error('Error:', error);
    } else {
      // Em produção, usar JSON estruturado
      console.log(JSON.stringify(logEntry));
    }
  }

  error(message: string, context?: any, error?: any) {
    this.log(LOG_LEVELS.ERROR, message, context, error);
  }

  warn(message: string, context?: any) {
    this.log(LOG_LEVELS.WARN, message, context);
  }

  info(message: string, context?: any) {
    this.log(LOG_LEVELS.INFO, message, context);
  }

  debug(message: string, context?: any) {
    if (this.isDevelopment) {
      this.log(LOG_LEVELS.DEBUG, message, context);
    }
  }

  // Método específico para logs de segurança
  security(message: string, context?: any) {
    this.log('SECURITY', message, context);
  }
}

export const logger = new Logger();