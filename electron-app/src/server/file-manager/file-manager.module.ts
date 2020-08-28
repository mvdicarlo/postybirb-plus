import { Module } from '@nestjs/common';
import { FileManagerService } from './file-manager.service';
import { FileManipulationModule } from 'src/server/file-manipulation/file-manipulation.module';

@Module({
  imports: [FileManipulationModule],
  providers: [FileManagerService],
  exports: [FileManagerService],
})
export class FileManagerModule {}
