import { Module } from '@nestjs/common';
import { Furiffic } from './furiffic.service';

@Module({
  providers: [Furiffic],
  exports: [Furiffic],
})
export class FurifficModule {}
