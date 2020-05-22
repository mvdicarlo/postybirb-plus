import { Module } from '@nestjs/common';
import { FurryLife } from './furry-life.service';
import { FurryLifeController } from './furry-life.controller';

@Module({
  providers: [FurryLife],
  controllers: [FurryLifeController],
  exports: [FurryLife],
})
export class FurryLifeModule {}
