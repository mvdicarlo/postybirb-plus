import { IsNotEmpty } from 'class-validator';
import { TagGroup } from './tag-group.interface';

export class TagGroupDto implements TagGroup {
  id: string;

  @IsNotEmpty()
  alias: string;

  @IsNotEmpty()
  tags: string[];
}
