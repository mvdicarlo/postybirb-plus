import { IsNotEmpty, IsString } from 'class-validator';
import { DescriptionTemplate } from './description-template.interface';

export class DescriptionTemplateDto implements DescriptionTemplate {
  id: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsString()
  description: string;
}
