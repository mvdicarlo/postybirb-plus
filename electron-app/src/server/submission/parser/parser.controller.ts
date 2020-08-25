import { Controller } from '@nestjs/common';
import { ParserService } from './parser.service';

@Controller('submission-parser')
export class ParserController {
  constructor(private readonly service: ParserService) {}
}
