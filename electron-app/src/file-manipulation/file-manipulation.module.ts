import { Module } from '@nestjs/common';
import { FileManipulationService } from './file-manipulation.service';

@Module({
  providers: [FileManipulationService]
})
export class FileManipulationModule {}
