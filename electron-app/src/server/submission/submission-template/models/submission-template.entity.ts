import Entity from 'src/server/database/models/entity.model';
import { SubmissionTemplate } from '../interfaces/submission-template.interface';
import { SubmissionType } from 'src/server/submission/enums/submission-type.enum';
import { Parts } from 'src/server/submission/submission-part/interfaces/submission-part.interface';
import { IsNotEmpty, IsString, IsEnum, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import SubmissionPartEntity from 'src/server/submission/submission-part/models/submission-part.entity';

export default class SubmissionTemplateEntity extends Entity implements SubmissionTemplate {
  @IsNotEmpty()
  @IsString()
  alias: string;

  @IsNotEmpty()
  @IsEnum(SubmissionType)
  type: SubmissionType;

  @IsNotEmpty()
  @IsObject()
  @Type(() => SubmissionPartEntity)
  parts: Parts;

  constructor(partial: Partial<SubmissionTemplate>) {
    super(partial);
  }
}
