import { Module } from '@nestjs/common';
import { Inkbunny } from './inkbunny.service';

@Module({
  providers: [Inkbunny],
  exports: [Inkbunny],
})
export class InkbunnyModule {}
