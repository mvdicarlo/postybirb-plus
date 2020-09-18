import { EntityIntf } from 'postybirb-commons';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import * as _ from 'lodash';
import * as uuid from 'uuid/v1';
import { classToPlain } from 'class-transformer';

export default class Entity implements EntityIntf {
  @IsNotEmpty()
  @IsString()
  _id: string;

  @IsNumber()
  @IsOptional()
  created: number;

  @IsOptional()
  @IsNumber()
  lastUpdated: number;

  constructor(partial: Partial<Entity>) {
    Object.assign(this, partial);
    if (!this._id) {
      this._id = uuid();
    }
  }

  public copy(): this {
    const constr: any = this.constructor;
    return new constr(_.cloneDeep(classToPlain(this)));
  }

  public asPlain<T>(): T {
    return classToPlain(this) as T;
  }
}
