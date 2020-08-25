import { Controller } from '@nestjs/common';
import { GenericWebsiteController } from '../generic/generic.controller';
import { DeviantArt } from './deviant-art.service';

@Controller('deviantart')
export class DeviantArtController extends GenericWebsiteController {
  constructor(readonly service: DeviantArt) {
    super(service);
  }
}
