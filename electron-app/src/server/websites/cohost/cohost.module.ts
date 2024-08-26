import { Module } from '@nestjs/common';
import { Cohost } from './cohost.service';
import { CohostController } from './cohost.controller';

@Module({
  providers: [Cohost],
  controllers: [CohostController],
  exports: [Cohost],
})
export class CohostModule {}
