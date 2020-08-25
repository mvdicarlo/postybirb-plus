import { Controller } from '@nestjs/common';
import { SubscribeStar } from './subscribe-star.service';
import { GenericWebsiteController } from '../generic/generic.controller';

@Controller('subscribestar')
export class SubscribeStarController extends GenericWebsiteController {
  constructor(readonly service: SubscribeStar) {
    super(service);
  }
}
