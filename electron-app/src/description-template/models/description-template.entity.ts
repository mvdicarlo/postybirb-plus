import Entity from 'src/base/entity/entity.base';
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
}
