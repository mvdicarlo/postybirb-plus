import { Module } from '@nestjs/common';
import { WeasylController } from './weasyl/weasyl.controller';
import { Weasyl } from './weasyl/weasyl.service';
import { WebsiteProvider } from './website-provider.service';

@Module({
  controllers: [WeasylController],
  providers: [Weasyl, WebsiteProvider],
  exports: [WebsiteProvider],
})
export class WebsitesModule {}
