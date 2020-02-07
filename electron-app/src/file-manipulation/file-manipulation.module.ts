import { Module } from '@nestjs/common';
import { FileManipulationService } from './file-manipulation.service';
import { SettingsModule } from 'src/settings/settings.module';

@Module({
  imports: [SettingsModule],
  providers: [FileManipulationService],
  exports: [FileManipulationService],
})
export class FileManipulationModule {}
