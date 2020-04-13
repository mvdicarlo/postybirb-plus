import { Module } from '@nestjs/common';
import { KoFi } from './ko-fi.service';

@Module({
  providers: [KoFi],
  exports: [KoFi],
})
export class KoFiModule {}
