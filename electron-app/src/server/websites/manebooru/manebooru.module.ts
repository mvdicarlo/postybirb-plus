import { Module } from '@nestjs/common';
import { Manebooru } from './manebooru.service';

@Module({
  providers: [Manebooru],
  exports: [Manebooru],
})
export class ManebooruModule {}
