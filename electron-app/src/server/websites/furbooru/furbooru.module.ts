import { Module } from '@nestjs/common';
import { Furbooru } from './furbooru.service';

@Module({
  providers: [Furbooru],
  exports: [Furbooru],
})
export class FurbooruModule {}
