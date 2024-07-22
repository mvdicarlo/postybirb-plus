import { Module } from '@nestjs/common';
import { ValidatorService } from './validator.service';
import { WebsitesModule } from 'src/server/websites/websites.module';
import { ParserModule } from '../parser/parser.module';

@Module({
  imports: [WebsitesModule, ParserModule],
  providers: [ValidatorService],
  exports: [ValidatorService],
})
export class ValidatorModule {}
