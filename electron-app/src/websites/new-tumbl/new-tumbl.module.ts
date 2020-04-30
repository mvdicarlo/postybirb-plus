import { Module } from '@nestjs/common';
import { NewTumbl } from './new-tumbl.service';
import { NewTumblController } from './new-tumbl.controller';

@Module({
  providers: [NewTumbl],
  controllers: [NewTumblController],
  exports: [NewTumbl],
})
export class NewTumblModule {}
