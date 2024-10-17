import { Module } from '@nestjs/common';
import { Cohost } from './cohost.service';

@Module({
  providers: [Cohost],
  exports: [Cohost],
})
export class CohostModule {}
