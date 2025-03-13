import { Module } from '@nestjs/common';
import { WordPress } from './wordpress.service';

@Module({
  providers: [WordPress],
  exports: [WordPress],
})
export class WordPressModule {}
