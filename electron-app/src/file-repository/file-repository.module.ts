import { Module } from '@nestjs/common';
import { FileRepositoryService } from './file-repository.service';

@Module({
  providers: [FileRepositoryService],
  exports: [FileRepositoryService],
})
export class FileRepositoryModule {}
