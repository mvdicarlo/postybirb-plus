import { Module } from '@nestjs/common';
import { Pixelfed } from './pixelfed.service';
import { FileManagerModule } from 'src/server/file-manager/file-manager.module';

@Module({
  providers: [Pixelfed],
  exports: [Pixelfed],
  imports: [FileManagerModule],
})
export class PixelfedModule {}
