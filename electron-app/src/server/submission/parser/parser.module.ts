import { Module } from '@nestjs/common';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';
import { TagConverterModule } from 'src/server/tag-converter/tag-converter.module';
import { CustomShortcutModule } from 'src/server/custom-shortcut/custom-shortcut.module';
import { FileManipulationModule } from 'src/server/file-manipulation/file-manipulation.module';
import { SettingsModule } from 'src/server/settings/settings.module';
import { WebsitesModule } from 'src/server/websites/websites.module';

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
