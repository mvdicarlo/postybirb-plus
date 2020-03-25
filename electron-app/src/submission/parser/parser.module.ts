import { Module } from '@nestjs/common';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';
import { TagConverterModule } from 'src/tag-converter/tag-converter.module';
import { CustomShortcutModule } from 'src/custom-shortcut/custom-shortcut.module';
import { FileManipulationModule } from 'src/file-manipulation/file-manipulation.module';
import { SettingsModule } from 'src/settings/settings.module';
import { WebsitesModule } from 'src/websites/websites.module';

@Module({
  imports: [
    TagConverterModule,
    CustomShortcutModule,
    FileManipulationModule,
    SettingsModule,
    WebsitesModule,
  ],
  controllers: [ParserController],
  providers: [ParserService],
  exports: [ParserService],
})
export class ParserModule {}
