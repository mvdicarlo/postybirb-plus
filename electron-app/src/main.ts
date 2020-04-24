import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { SSL } from './ssl';
import * as compression from 'compression';
import { AuthGuard } from './auth.guard';
import { CustomLogger } from './custom.logger';
import { ensure } from './directories';

const logger: CustomLogger = new CustomLogger();

async function bootstrap() {
  ensure();
  const { key, cert } = SSL.getOrCreate();
  const app = await NestFactory.create(AppModule, {
    httpsOptions: {
      key,
      cert,
    },
    logger,
  });
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalGuards(new AuthGuard());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(compression());
  await app.listen(process.env.PORT);
}

process.on('uncaughtException', err => logger.error(err.message, err.stack, 'Uncaught Exception'));
process.on('unhandledRejection', err => logger.error(err, '', 'Unhandled Rejection'));

module.exports = bootstrap;
