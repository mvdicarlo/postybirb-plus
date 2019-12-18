import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as shortid from 'shortid';
import { DescriptionTemplateDto } from './description-template.dto';
import { DescriptionTemplateEvent } from './description-template.events.enum';
import { DescriptionTemplateRepository } from './description-template.repository';
import { EventsGateway } from 'src/events/events.gateway';

@Injectable()
export class DescriptionTemplateService {
  private readonly logger = new Logger(DescriptionTemplateService.name);

  constructor(
    private repository: DescriptionTemplateRepository,
    private readonly eventEmitter: EventsGateway,
  ) {}

  getAll() {
    return this.repository.findAll();
  }

  async create(descriptionTemplateDto: DescriptionTemplateDto) {
    this.logger.log(descriptionTemplateDto, 'Create Description Template');
    descriptionTemplateDto.id = shortid.generate();
    const dt = await this.repository.create(descriptionTemplateDto);
    this.eventEmitter.emit(DescriptionTemplateEvent.CREATED, dt);
    return dt;
  }

  remove(id: string) {
    this.logger.log(id, 'Delete Description Template');
    this.eventEmitter.emit(DescriptionTemplateEvent.REMOVED, id);
    return this.repository.remove(id);
  }

  async update(update: DescriptionTemplateDto) {
    this.logger.log(update.id, 'Update Description Template');
    const exists = await this.repository.find(update.id);
    if (!exists) {
      throw new NotFoundException(`Description template ${update.id} does not exist.`);
    }
    await this.repository.update(update.id, {
      content: update.content,
      description: update.description,
      title: update.title,
    });

    this.eventEmitter.emit(DescriptionTemplateEvent.UPDATED, update);
  }
}
