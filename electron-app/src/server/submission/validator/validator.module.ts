import { Module } from '@nestjs/common';
import { ValidatorService } from './validator.service';
import { WebsitesModule } from 'src/server/websites/websites.module';

@Module({
  imports: [WebsitesModule],
  providers: [ValidatorService],
  exports: [ValidatorService],
})
export class ValidatorModule {}
