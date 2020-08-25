import { Module } from '@nestjs/common';
import { DeviantArt } from './deviant-art.service';
import { DeviantArtController } from './deviant-art.controller';

@Module({
  providers: [DeviantArt],
  controllers: [DeviantArtController],
  exports: [DeviantArt],
})
export class DeviantArtModule {}
