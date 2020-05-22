import { Module } from '@nestjs/common';
import { Custom } from './custom.service';

@Module({
  providers: [Custom],
  exports: [Custom],
})
export class CustomModule {}
