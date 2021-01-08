import { Module } from '@nestjs/common';
import { KoFi } from './ko-fi.service';
import { KoFiController } from './ko-fi.controller';

@Module({
  providers: [KoFi],
  exports: [KoFi],
  controllers: [KoFiController],
})
export class KoFiModule {}
