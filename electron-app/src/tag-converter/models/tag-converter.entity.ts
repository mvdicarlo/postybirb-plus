import Entity from 'src/database/models/entity.model';
import { IsString, IsNotEmpty, IsBoolean, IsObject } from 'class-validator';
import { TagConverter } from '../interfaces/tag-converter.interface';

export default class TagConverterEntity extends Entity implements TagConverter {
  @IsString()
  @IsNotEmpty()
  tag: string;

  @IsObject()
  @IsNotEmpty()
  conversions: Record<string /* Website ID */, string>;

  constructor(partial?: Partial<TagConverterEntity>) {
    super(partial);
  }

  getTagForWebsite(website: string): string {
    return this.conversions[website];
  }

  hasConversion(website: string): boolean {
    return !!this.getTagForWebsite(website);
  }
}
