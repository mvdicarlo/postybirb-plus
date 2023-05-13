import { Module } from '@nestjs/common';
import { MissKey } from './misskey.service';
import { FileManagerModule } from 'src/server/file-manager/file-manager.module';

@Module({
  providers: [MissKey],
  exports: [MissKey],
  imports: [FileManagerModule],
})
export class MissKeyModule {}
