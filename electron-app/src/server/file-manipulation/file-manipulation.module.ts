import { Module } from '@nestjs/common';
import { FileManipulationService } from './file-manipulation.service';
import { SettingsModule } from 'src/server/settings/settings.module';
import { ImageManipulationPoolService } from './pools/image-manipulation-pool.service';

@Module({
  imports: [SettingsModule],
  providers: [FileManipulationService, ImageManipulationPoolService],
  exports: [FileManipulationService, ImageManipulationPoolService],
})
export class FileManipulationModule {}
