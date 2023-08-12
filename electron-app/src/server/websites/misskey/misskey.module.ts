import { Module } from '@nestjs/common';
import { MissKey } from './misskey.service';
import { FileManagerModule } from 'src/server/file-manager/file-manager.module';
import { MissKeyController } from './misskey.controller';

@Module({
  controllers: [MissKeyController],
  providers: [MissKey],
  exports: [MissKey],
  imports: [FileManagerModule],
})
export class MissKeyModule {}
