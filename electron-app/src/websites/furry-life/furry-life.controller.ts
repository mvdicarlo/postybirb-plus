import { Controller } from '@nestjs/common';
import { GenericWebsiteController } from '../generic/generic.controller';
import { FurryLife } from './furry-life.service';

@Controller('furrylife')
export class FurryLifeController extends GenericWebsiteController {
  constructor(readonly service: FurryLife) {
    super(service);
  }
}
