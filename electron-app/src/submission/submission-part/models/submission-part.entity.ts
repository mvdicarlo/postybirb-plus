import Entity from 'src/base/entity/entity.base';
import { SubmissionPart, PostStatus } from '../interfaces/submission-part.interface';
import { DefaultOptions } from 'src/submission/submission-part/interfaces/default-options.interface';
import { IsBoolean, IsObject, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';

export default class SubmissionPartEntity<T extends DefaultOptions> extends Entity
  implements SubmissionPart<T> {
  @Expose()
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
