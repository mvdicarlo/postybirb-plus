import { Injectable } from '@nestjs/common';
import { TagGroupRepository } from './tag-group.repository';
import { TagGroup } from './tag-group.interface';
import { TagGroupDto } from './tag-group.dto';
import * as shortid from 'shortid';
import { EventsGateway } from 'src/events/events.gateway';
import { TagGroupEvent } from './tag-group.events.enum';

@Injectable()
export class TagGroupService {
  constructor(
    private readonly repository: TagGroupRepository,
    private readonly eventEmitter: EventsGateway,
  ) {}

  getAll() {
    return this.repository.findAll();
  }

  async create(tagGroup: TagGroupDto) {
    tagGroup.id = shortid.generate();
    const newTagGroup = await this.repository.create(tagGroup);
    this.eventEmitter.emit(TagGroupEvent.ADDED, newTagGroup);
    return newTagGroup;
  }

  async update(tagGroup: TagGroup) {
    await this.repository.update(tagGroup.id, { alias: tagGroup.alias, tags: tagGroup.tags });
    this.eventEmitter.emit(TagGroupEvent.UPDATED, tagGroup);
  }

  async deleteTagGroup(id: string) {
    await this.repository.remove(id);
    this.eventEmitter.emit(TagGroupEvent.REMOVED, id);
  }
}
