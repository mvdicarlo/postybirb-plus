import { Module } from '@nestjs/common';
import { WeasylController } from './weasyl.controller';
import { Weasyl } from './weasyl.service';

@Module({
  controllers: [WeasylController],
  providers: [Weasyl],
  exports: [Weasyl],
})
export class WeasylModule {}
