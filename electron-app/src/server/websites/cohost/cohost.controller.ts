import { Controller } from '@nestjs/common';
import { GenericWebsiteController } from '../generic/generic.controller';
import { Cohost } from './cohost.service';

@Controller('cohost')
export class CohostController extends GenericWebsiteController {
  constructor(readonly service: Cohost) {
    super(service);
  }
}
