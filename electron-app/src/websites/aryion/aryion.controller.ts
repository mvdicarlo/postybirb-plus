import { Controller } from '@nestjs/common';
import { GenericWebsiteController } from '../generic/generic.controller';
import { Aryion } from './aryion.service';

@Controller('aryion')
export class AryionController extends GenericWebsiteController {
  constructor(readonly service: Aryion) {
    super(service);
  }
}
