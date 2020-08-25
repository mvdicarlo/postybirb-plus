import { Module } from '@nestjs/common';
import { SoFurry } from './so-furry.service';
import { SoFurryController } from './so-furry.controller';

@Module({
  providers: [SoFurry],
  controllers: [SoFurryController],
  exports: [SoFurry],
})
export class SoFurryModule {}
