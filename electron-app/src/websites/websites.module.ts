import { Module } from '@nestjs/common';
import { WeasylController } from './weasyl/weasyl.controller';
import { Weasyl } from './weasyl/weasyl.service';

@Module({
  controllers: [WeasylController],
  providers: [Weasyl]
})
export class WebsitesModule {}
