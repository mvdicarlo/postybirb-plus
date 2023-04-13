import { Module } from '@nestjs/common';
import { FileManagerService } from './file-manager.service';
import { FileManipulationModule } from 'src/server/file-manipulation/file-manipulation.module';
import { ImageManipulationPoolService } from 'src/server/file-manipulation/pools/image-manipulation-pool.service';

@Module({
  imports: [FileManipulationModule],
  providers: [FileManagerService],
  exports: [FileManagerService],
})
export class FileManagerModule {}
