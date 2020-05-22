import { Controller } from '@nestjs/common';
import { GenericWebsiteController } from '../generic/generic.controller';
import { Patreon } from './patreon.service';

@Controller('patreon')
export class PatreonController extends GenericWebsiteController {
  constructor(readonly service: Patreon) {
    super(service);
  }
}
