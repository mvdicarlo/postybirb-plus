import { Controller } from '@nestjs/common';
import { Weasyl } from './weasyl.service';
import { GenericWebsiteController } from '../generic/generic.controller';

@Controller('weasyl')
export class WeasylController extends GenericWebsiteController {
  constructor(readonly service: Weasyl) {
    super(service);
  }
}
