import { TagGroup } from '../interfaces/tag-group.interface';
import { IsArray, IsString, IsNotEmpty } from 'class-validator';
import Entity from '../../database/models/entity.model';

export default class TagGroupEntity extends Entity implements TagGroup {
  @IsString()
  @IsNotEmpty()
  alias: string;

  @IsArray()
  @IsNotEmpty()
  tags: string[];

  constructor(partial?: Partial<TagGroup>) {
    super(partial);
  }
}
