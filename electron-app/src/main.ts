import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { AppGlobal } from './app-global.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, (global as AppGlobal).DEBUG_MODE ? undefined : {
    logger: ['error', 'warn', 'log'],
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT);
}

module.exports = bootstrap;
