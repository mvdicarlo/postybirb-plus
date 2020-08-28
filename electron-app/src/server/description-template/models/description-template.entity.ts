import Entity from 'src/server/database/models/entity.model';
import { DescriptionTemplate } from '../interfaces/description-template.interface';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export default class DescriptionTemplateEntity extends Entity implements DescriptionTemplate {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  description?: string;

  @IsString()
  content: string;

  constructor(partial?: Partial<DescriptionTemplate>) {
    super(partial);
  }
}
