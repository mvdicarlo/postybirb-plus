import { Module } from '@nestjs/common';
import { PiczelController } from './piczel.controller';
import { Piczel } from './piczel.service';

@Module({
  controllers: [PiczelController],
  providers: [Piczel],
  exports: [Piczel]
})
export class PiczelModule {}
