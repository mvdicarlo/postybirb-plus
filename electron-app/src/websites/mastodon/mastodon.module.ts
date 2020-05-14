import { Module } from '@nestjs/common';
import { Mastodon } from './mastodon.service';

@Module({
  providers: [Mastodon],
  exports: [Mastodon],
})
export class MastodonModule {}
