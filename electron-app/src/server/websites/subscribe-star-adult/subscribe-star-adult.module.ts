import { Module } from '@nestjs/common';
import { SubscribeStarAdult } from './subscribe-star-adult.service';
import { SubscribeStarAdultController } from './subscribe-star-adult.controller';

@Module({
  providers: [SubscribeStarAdult],
  exports: [SubscribeStarAdult],
  controllers: [SubscribeStarAdultController],
})
export class SubscribeStarAdultModule {}
