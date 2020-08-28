import { Controller } from '@nestjs/common';
import { GenericWebsiteController } from '../generic/generic.controller';
import { FurAffinity } from './fur-affinity.service';

@Controller('furaffinity')
export class FurAffinityController extends GenericWebsiteController {
  constructor(readonly service: FurAffinity) {
    super(service);
  }
}
