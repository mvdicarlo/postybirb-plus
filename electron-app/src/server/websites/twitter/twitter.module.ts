import { Module } from '@nestjs/common';
import { Twitter } from './twitter.service';

@Module({
  providers: [Twitter],
  exports: [Twitter],
})
export class TwitterModule {}
