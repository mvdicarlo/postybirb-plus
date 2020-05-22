import { Module } from '@nestjs/common';
import { e621 } from './e621.service';

@Module({
  providers: [e621],
  exports: [e621],
})
export class E621Module {}
