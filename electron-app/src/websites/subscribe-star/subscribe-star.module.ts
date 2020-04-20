import { Module } from '@nestjs/common';
import { SubscribeStar } from './subscribe-star.service';

@Module({
  providers: [SubscribeStar],
  exports: [SubscribeStar],
})
export class SubscribeStarModule {}
