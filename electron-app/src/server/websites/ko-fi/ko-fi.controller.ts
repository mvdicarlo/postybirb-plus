import { Controller } from '@nestjs/common';
import { GenericWebsiteController } from '../generic/generic.controller';
import { KoFi } from './ko-fi.service';

@Controller('kofi')
export class KoFiController extends GenericWebsiteController {
  constructor(readonly service: KoFi) {
    super(service);
  }
}
