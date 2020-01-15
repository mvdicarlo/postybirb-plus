import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
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
    logger: global.DEBUG_MODE ? undefined : ['error', 'warn', 'log'],
  });
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalGuards(new AuthGuard());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(compression());
  await app.listen(process.env.PORT);
}

module.exports = bootstrap;
