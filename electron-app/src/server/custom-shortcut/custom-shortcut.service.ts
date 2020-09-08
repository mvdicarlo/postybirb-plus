import { Injectable, Inject, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import {
  CustomShortcutRepository,
  CustomShortcutRepositoryToken,
} from './custom-shortcut.repository';
import { EventsGateway } from 'src/server/events/events.gateway';
import CustomShortcutEntity from './models/custom-shortcut.entity';
import { Events } from 'postybirb-commons';

@Injectable()
export class CustomShortcutService {
  private readonly logger = new Logger(CustomShortcutService.name);

  constructor(
    @Inject(CustomShortcutRepositoryToken)
    private readonly repository: CustomShortcutRepository,
    private readonly eventEmitter: EventsGateway,
  ) {}

  async get(id: string) {
    const entity = await this.repository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Custom Shortcut ${id} could not be found`);
    }
    return entity;
  }

  getAll() {
    return this.repository.find();
  }

  async create(customShortcutDto: CustomShortcutEntity) {
    this.logger.log(customShortcutDto, 'Create Custom Shortcut');
    if (!(await this.isUniqueShortcut(customShortcutDto.shortcut))) {
      throw new BadRequestException('Shortcut must be unique');
    }
    const dt = await this.repository.save(customShortcutDto);
    this.eventEmitter.emit(Events.CustomShortcutEvent.CREATED, dt);
    return dt;
  }

  remove(id: string) {
    this.logger.log(id, 'Delete Custom Shortcut');
    this.eventEmitter.emit(Events.CustomShortcutEvent.REMOVED, id);
    return this.repository.remove(id);
  }

  async update(update: CustomShortcutEntity) {
    this.logger.log(update._id, 'Update Custom Shortcut');
    const exists = await this.get(update._id);
    exists.content = update.content;
    exists.shortcut = update.shortcut;
    exists.isDynamic = update.isDynamic;
    await this.repository.update(exists);

    this.eventEmitter.emit(Events.CustomShortcutEvent.UPDATED, exists);
  }

  async isUniqueShortcut(shortcut: string): Promise<boolean> {
    const alreadyInUse = await this.repository.find({ shortcut });
    return !!alreadyInUse;
  }
}
