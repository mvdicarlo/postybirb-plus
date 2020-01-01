import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { AppGlobal } from './app-global.interface';
import { SSL } from './ssl';

async function bootstrap() {
  const { key, cert } = SSL.getOrCreate();
  const app = await NestFactory.create(AppModule, {
    httpsOptions: {
      key,
      cert,
    },
    logger: (global as AppGlobal).DEBUG_MODE ? undefined : ['error', 'warn', 'log']
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT);
}

module.exports = bootstrap;
