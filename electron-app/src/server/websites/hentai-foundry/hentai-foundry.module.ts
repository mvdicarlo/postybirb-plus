import { Module } from '@nestjs/common';
import { HentaiFoundry } from './hentai-foundry.service';

@Module({
  providers: [HentaiFoundry],
  exports: [HentaiFoundry],
})
export class HentaiFoundryModule {}
