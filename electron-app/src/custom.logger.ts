import { app } from 'electron';
import { Logger } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';
import 'winston-daily-rotate-file';

export class CustomLogger extends Logger {
  static logger = winston.createLogger({
    transports: [
      new winston.transports.DailyRotateFile({
        filename: 'app-%DATE%.log',
        datePattern: 'YYY-MM-DD',
        maxSize: '20m',
        maxFiles: 15,
        dirname: path.join(app.getPath('userData'), 'logs'),
        auditFile: path.join(app.getPath('userData'), 'logs', 'log-audit.json'),
      }),
    ],
    exitOnError: false,
  });

  error(message: any, trace?: string, context?: string) {
    super.error(message, trace, context);
    CustomLogger.logger.error(`[${context || this.context}] ${message}\n${trace}`);
  }

  log(message: string, context?: string) {
    super.log(message, context);
    if (typeof message !== 'string') {
      CustomLogger.logger.info(
        `[${context || this.context}] ${
          typeof message === 'object' ? JSON.stringify(message, null, 1) : message
        }`,
      );
    } else if (!message.match(/(Mapped|Module)/)) {
      CustomLogger.logger.info(`[${context || this.context}] ${message}`);
    }
  }

  warn(message: string, context?: string) {
    super.warn(message, context);
    CustomLogger.logger.warn(`[${context || this.context}] ${message}`);
  }

  debug(message: string, context?: string) {
    if (global.DEBUG_MODE) {
      super.debug(message, context);
      CustomLogger.logger.debug(`[${context || this.context}] ${message}`);
    }
  }

  verbose(message: string, context?: string) {
    if (global.DEBUG_MODE) {
      super.verbose(message, context);
      CustomLogger.logger.verbose(`[${context || this.context}] ${message}`);
    }
  }
}
