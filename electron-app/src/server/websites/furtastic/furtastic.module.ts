import { Module } from '@nestjs/common';
import { Furtastic } from './furtastic.service';

@Module({
  providers: [Furtastic],
  exports: [Furtastic],
})
export class FurtasticModule {}
