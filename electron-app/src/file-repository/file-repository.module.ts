import { Module } from '@nestjs/common';
import { FileRepositoryService } from './file-repository.service';
import { FileManipulationModule } from 'src/file-manipulation/file-manipulation.module';

@Module({
  imports: [FileManipulationModule],
  providers: [FileRepositoryService],
  exports: [FileRepositoryService],
})
export class FileRepositoryModule {}
