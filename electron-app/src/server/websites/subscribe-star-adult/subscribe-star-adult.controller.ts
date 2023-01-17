import { Controller } from '@nestjs/common';
import { SubscribeStarAdult } from './subscribe-star-adult.service';
import { GenericWebsiteController } from '../generic/generic.controller';

@Controller('subscribestaradult')
export class SubscribeStarAdultController extends GenericWebsiteController {
  constructor(readonly service: SubscribeStarAdult) {
    super(service);
  }
}
