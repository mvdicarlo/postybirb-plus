import { Module } from '@nestjs/common';
import { FurAffinity } from './fur-affinity.service';
import { FurAffinityController } from './fur-affinity.controller';

@Module({
  providers: [FurAffinity],
  controllers: [FurAffinityController],
  exports: [FurAffinity],
})
export class FurAffinityModule {}
