import { Module } from '@nestjs/common';
import { Aryion } from './aryion.service';
import { AryionController } from './aryion.controller';

@Module({
  providers: [Aryion],
  controllers: [AryionController],
  exports: [Aryion],
})
export class AryionModule {}
