import { Controller } from '@nestjs/common';
import { Piczel } from './piczel.service';
import { GenericWebsiteController } from '../generic/generic.controller';

@Controller('piczel')
export class PiczelController extends GenericWebsiteController {
  constructor(readonly service: Piczel) {
    super(service);
  }
}
