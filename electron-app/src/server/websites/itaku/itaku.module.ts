import { Module } from '@nestjs/common';
import { Itaku } from './itaku.service';
import { ItakuController } from './itaku.controller';

@Module({
  providers: [Itaku],
  controllers: [ItakuController],
  exports: [Itaku],
})
export class ItakuModule {}
