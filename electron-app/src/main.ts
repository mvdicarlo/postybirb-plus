import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { AppGlobal } from './app-global.interface';
import { SSL } from './ssl';
import * as compression from 'compression';
import { AuthGuard } from './auth.guard';

async function bootstrap() {
  const { key, cert } = SSL.getOrCreate();
  const app = await NestFactory.create(AppModule, {
    httpsOptions: {
      key,
      cert,
    },
    logger: (global as AppGlobal).DEBUG_MODE ? undefined : ['error', 'warn', 'log'],
  });
  app.useGlobalGuards(new AuthGuard());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(compression());
  await app.listen(process.env.PORT);
}

module.exports = bootstrap;
