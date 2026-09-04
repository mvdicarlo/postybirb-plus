import { Module } from '@nestjs/common';
import { Instagram } from './instagram.service';
import { InstagramController } from './instagram.controller';

@Module({
  providers: [Instagram],
  controllers: [InstagramController],
  exports: [Instagram],
})
export class InstagramModule {}
