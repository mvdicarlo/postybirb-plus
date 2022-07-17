import { Module } from '@nestjs/common';
import { Picarto } from './picarto.service';
import { PicartoController } from './picarto.controller';

@Module({
  providers: [Picarto],
  exports: [Picarto],
  controllers: [PicartoController],
})
export class PicartoModule {}
