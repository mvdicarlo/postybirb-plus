import { Controller } from '@nestjs/common';
import { GenericWebsiteController } from '../generic/generic.controller';
import { NewTumbl } from './new-tumbl.service';

@Controller('newtumbl')
export class NewTumblController extends GenericWebsiteController {
  constructor(readonly service: NewTumbl) {
    super(service);
  }
}
