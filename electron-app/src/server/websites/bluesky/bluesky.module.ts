import { Module } from '@nestjs/common';
import { Bluesky } from './bluesky.service';
import { BlueskyController } from './bluesky.controller';

@Module({
  providers: [Bluesky],
  controllers: [BlueskyController],
  exports: [Bluesky],
})
export class BlueskyModule {}
