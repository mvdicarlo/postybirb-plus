import { Module } from '@nestjs/common';
import { SubscribeStar } from './subscribe-star.service';
import { SubscribeStarController } from './subscribe-star.controller';

@Module({
  providers: [SubscribeStar],
  exports: [SubscribeStar],
  controllers: [SubscribeStarController],
})
export class SubscribeStarModule {}
