import { Module } from '@nestjs/common';
import { Newgrounds } from './newgrounds.service';

@Module({
  providers: [Newgrounds],
  exports: [Newgrounds],
})
export class NewgroundsModule {}
