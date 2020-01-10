import { TagGroup } from '../interfaces/tag-group.interface';
import { IsArray, IsString } from 'class-validator';
import Entity from '../../base/entity/entity.base';

export default class TagGroupEntity extends Entity implements TagGroup {
  @IsString()
  alias: string;

  @IsArray()
  tags: string[];

  constructor(partial: Partial<TagGroupEntity>) {
    super(partial);
  }
}
