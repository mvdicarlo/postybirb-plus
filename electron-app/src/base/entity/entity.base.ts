import { EntityIntf } from './entity.base.interface';
import { IsOptional, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import * as uuid from 'uuid/v1';
import { Expose } from 'class-transformer';

export default class Entity implements EntityIntf {
  @IsNotEmpty()
  @IsString()
  _id: string;

  @Expose()
  get id(): string {
    return this._id;
  }
  set id(id: string) {}

  created: string;
  lastUpdated: string;

  constructor(partial: Partial<Entity>) {
    Object.assign(this, partial);
    if (!this._id) {
      this._id = uuid();
    }
  }
}
