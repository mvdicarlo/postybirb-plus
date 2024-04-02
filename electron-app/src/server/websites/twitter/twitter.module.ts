import { Module } from '@nestjs/common';
import { TwitterAPIService } from './twitter-api.service';
import { TwitterController } from './twitter.controller';
import { Twitter } from './twitter.service';

@Module({
  controllers: [TwitterController],
  providers: [Twitter, TwitterAPIService],
  exports: [Twitter],
})
export class TwitterModule {}
