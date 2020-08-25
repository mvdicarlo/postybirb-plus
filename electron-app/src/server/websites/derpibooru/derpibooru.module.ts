import { Module } from '@nestjs/common';
import { Derpibooru } from './derpibooru.service';

@Module({
  providers: [Derpibooru],
  exports: [Derpibooru],
})
export class DerpibooruModule {}
