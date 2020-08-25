import { Module } from '@nestjs/common';
import { Artconomy } from './artconomy.service';

@Module({
  providers: [Artconomy],
  exports: [Artconomy],
})
export class ArtconomyModule {}
