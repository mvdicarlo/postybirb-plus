import { Controller } from '@nestjs/common';
import { SoFurry } from './so-furry.service';
import { GenericWebsiteController } from '../generic/generic.controller';

@Controller('sofurry')
export class SoFurryController extends GenericWebsiteController {
  constructor(readonly service: SoFurry) {
    super(service);
  }
}
