import { Controller } from '@nestjs/common';
import { GenericWebsiteController } from '../generic/generic.controller';
import { FurryNetwork } from './furry-network.service';

@Controller('furrynetwork')
export class FurryNetworkController extends GenericWebsiteController {
  constructor(readonly service: FurryNetwork) {
    super(service);
  }
}
