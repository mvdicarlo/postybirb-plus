import { Module } from '@nestjs/common';
import { Route50 } from './route50.service';

@Module({
  providers: [Route50],
  exports: [Route50],
})
export class Route50Module {}
