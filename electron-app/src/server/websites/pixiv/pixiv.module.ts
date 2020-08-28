import { Module } from '@nestjs/common';
import { Pixiv } from './pixiv.service';

@Module({
  providers: [Pixiv],
  exports: [Pixiv],
})
export class PixivModule {}
