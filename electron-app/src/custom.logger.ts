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
        datePattern: 'YYY-MM-DD-HH',
        maxSize: '20m',
        maxFiles: 15,
        dirname: path.join(app.getPath('userData'), 'logs'),
        auditFile: path.join(app.getPath('userData'), 'logs', 'log-audit.json'),
      }),
    ],
    exitOnError: false,
  });

  error(message: string, trace: string) {
    super.error(message, trace);
    CustomLogger.logger.error(`${message}\n${trace}`);
  }

  log(message: string) {
    super.log(message);
    if (typeof message !== 'string') {
      CustomLogger.logger.info(message);
    } else if (!message.match(/(Mapped|Module)/)) {
      CustomLogger.logger.info(message);
    }
  }

  warn(message: string) {
    super.warn(message);
    CustomLogger.logger.warn(message);
  }

  debug(message: string) {
    if (global.DEBUG_MODE) {
      super.debug(message);
      CustomLogger.logger.debug(message);
    }
  }

  verbose(message: string) {
    if (global.DEBUG_MODE) {
      super.verbose(message);
      CustomLogger.logger.verbose(message);
    }
  }
}
