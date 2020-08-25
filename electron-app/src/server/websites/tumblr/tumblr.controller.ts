import { Controller } from '@nestjs/common';
import { GenericWebsiteController } from '../generic/generic.controller';
import { Tumblr } from './tumblr.service';

@Controller('tumblr')
export class TumblrController extends GenericWebsiteController {
  constructor(readonly service: Tumblr) {
    super(service);
  }
}
