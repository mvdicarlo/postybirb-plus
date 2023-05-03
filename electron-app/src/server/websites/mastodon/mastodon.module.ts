import { Module } from '@nestjs/common';
import { Mastodon } from './mastodon.service';
import { FileManagerModule } from 'src/server/file-manager/file-manager.module';

@Module({
  providers: [Mastodon],
  exports: [Mastodon],
  imports: [FileManagerModule],
})
export class MastodonModule {}
