import { Controller } from '@nestjs/common';
import { GenericWebsiteController } from '../generic/generic.controller';
import { Itaku } from './itaku.service';

@Controller('itaku')
export class ItakuController extends GenericWebsiteController {
  constructor(readonly service: Itaku) {
    super(service);
  }
}
