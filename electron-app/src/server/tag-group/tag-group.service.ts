import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { TagGroupRepository, TagGroupRepositoryToken } from './tag-group.repository';
import { EventsGateway } from 'src/server/events/events.gateway';
import { TagGroupEvent } from './enums/tag-group.events.enum';
import TagGroupEntity from './models/tag-group.entity';

@Injectable()
export class TagGroupService {
  private readonly logger = new Logger(TagGroupService.name);

  constructor(
    @Inject(TagGroupRepositoryToken)
    private readonly repository: TagGroupRepository,
    private readonly eventEmitter: EventsGateway,
  ) {}

  async get(id: string) {
    const entity = await this.repository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Tag Group ${id} could not be found`);
    }
    return entity;
  }

  getAll() {
    return this.repository.find();
  }

  async create(tagGroup: TagGroupEntity) {
    this.logger.log(tagGroup, 'Create Tag Group');
    const newTagGroup = await this.repository.save(tagGroup);
    this.eventEmitter.emit(TagGroupEvent.CREATED, newTagGroup);
    return newTagGroup;
  }

  async update(tagGroup: TagGroupEntity) {
    this.logger.log(tagGroup._id, 'Update Tag Group');
    await this.repository.update(tagGroup);
    this.eventEmitter.emit(TagGroupEvent.UPDATED, tagGroup);
  }

  async remove(id: string) {
    this.logger.log(id, 'Delete Tag Group');
    await this.repository.remove(id);
    this.eventEmitter.emit(TagGroupEvent.REMOVED, id);
  }
}
