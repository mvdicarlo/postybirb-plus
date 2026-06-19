import { Controller } from '@nestjs/common';
import { GenericWebsiteController } from '../generic/generic.controller';
import { Instagram } from './instagram.service';

@Controller('instagram')
export class InstagramController extends GenericWebsiteController {
  constructor(readonly service: Instagram) {
    super(service);
  }
}
