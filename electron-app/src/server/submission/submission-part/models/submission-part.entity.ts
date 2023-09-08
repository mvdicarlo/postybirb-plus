import { DefaultOptions, PostStatus, SubmissionPart } from 'postybirb-commons';
import Entity from 'src/server/database/models/entity.model';

import { Expose } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export default class SubmissionPartEntity<T extends DefaultOptions>
  extends Entity
  implements SubmissionPart<T>
{
  @Expose()
  // eslint-disable-next-line
  // @ts-ignore
  get _id(): string {
    return `${this.submissionId}-${this.accountId}`; // generatated id
  }
  set _id(val: string) {}

  @IsObject()
  @IsNotEmpty()
  data: T;

  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsString()
  @IsNotEmpty()
  submissionId: string;

  @IsString()
  @IsNotEmpty()
  website: string;

  @IsBoolean()
  isDefault: boolean;

  @IsOptional()
  @IsString()
  postedTo: string;

  @IsString()
  postStatus: PostStatus;

  constructor(partial: Partial<SubmissionPartEntity<T>>) {
    super(partial);
    if (this.isDefault === undefined) {
      this.isDefault = false;
    }

    if (this.postStatus === undefined) {
      this.postStatus = 'UNPOSTED';
    }
  }
}
