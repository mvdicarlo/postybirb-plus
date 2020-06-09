import { Module } from '@nestjs/common';
import { Pillowfort } from './pillowfort.service';

@Module({
  providers: [Pillowfort],
  exports: [Pillowfort],
})
export class PillowfortModule {}
