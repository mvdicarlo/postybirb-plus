import { Module } from '@nestjs/common';
import { Pixelfed } from './pixelfed.service';

@Module({
  providers: [Pixelfed],
  exports: [Pixelfed],
})
export class PixelfedModule {}
