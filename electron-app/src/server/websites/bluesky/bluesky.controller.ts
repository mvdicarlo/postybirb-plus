import { Controller } from '@nestjs/common';
import { GenericWebsiteController } from '../generic/generic.controller';
import { Bluesky } from './bluesky.service';

@Controller('bluesky')
export class BlueskyController extends GenericWebsiteController {
  constructor(readonly service: Bluesky) {
    super(service);
  }
}
