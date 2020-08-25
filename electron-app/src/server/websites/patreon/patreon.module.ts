import { Module } from '@nestjs/common';
import { Patreon } from './patreon.service';
import { PatreonController } from './patreon.controller';

@Module({
  providers: [Patreon],
  controllers: [PatreonController],
  exports: [Patreon],
})
export class PatreonModule {}
