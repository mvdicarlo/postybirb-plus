import { Controller } from '@nestjs/common';
import { GenericWebsiteController } from '../generic/generic.controller';
import { Picarto } from './picarto.service';

@Controller('picarto')
export class PicartoController extends GenericWebsiteController {
  constructor(readonly service: Picarto) {
    super(service);
  }
}
