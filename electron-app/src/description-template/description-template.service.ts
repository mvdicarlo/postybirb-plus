import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DescriptionTemplateEvent } from './enums/description-template.events.enum';
import { DescriptionTemplateRepository } from './description-template.repository';
import { EventsGateway } from 'src/events/events.gateway';
import DescriptionTemplateEntity from './models/description-template.entity';

@Injectable()
export class DescriptionTemplateService {
  private readonly logger = new Logger(DescriptionTemplateService.name);

  constructor(
    private repository: DescriptionTemplateRepository,
    private readonly eventEmitter: EventsGateway,
  ) {}

  getAll() {
    return this.repository.find();
  }

  async create(descriptionTemplateDto: DescriptionTemplateEntity) {
    this.logger.log(descriptionTemplateDto, 'Create Description Template');
    const dt = await this.repository.save(descriptionTemplateDto);
    this.eventEmitter.emit(DescriptionTemplateEvent.CREATED, dt);
    return dt;
  }

  remove(id: string) {
    this.logger.log(id, 'Delete Description Template');
    this.eventEmitter.emit(DescriptionTemplateEvent.REMOVED, id);
    return this.repository.remove(id);
  }

  async update(update: DescriptionTemplateEntity) {
    this.logger.log(update.id, 'Update Description Template');
    const exists = await this.repository.findOne(update.id);
    if (!exists) {
      throw new NotFoundException(`Description template ${update.id} does not exist.`);
    }
    exists.content = update.content;
    exists.description = update.description;
    exists.title = update.title;
    await this.repository.update(exists);

    this.eventEmitter.emit(DescriptionTemplateEvent.UPDATED, exists);
  }
}
