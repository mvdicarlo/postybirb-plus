import { Injectable } from '@nestjs/common';
import { TagGroup } from './tag-group.interface';
import Repository from '../base/repository.base';

@Injectable()
export class TagGroupRepository extends Repository<TagGroup> {
  constructor() {
    super('tag-group');
  }
}
