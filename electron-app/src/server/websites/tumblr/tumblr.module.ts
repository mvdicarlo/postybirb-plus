import { Module } from '@nestjs/common';
import { Tumblr } from './tumblr.service';
import { TumblrController } from './tumblr.controller';

@Module({
  providers: [Tumblr],
  controllers: [TumblrController],
  exports: [Tumblr],
})
export class TumblrModule {}
