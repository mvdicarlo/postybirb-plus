import Entity from '../models/entity.model';
import { EntityIntf } from 'postybirb-commons';
import NedbDatabase from './nedb.database';
import { Injectable } from '@nestjs/common';

@Injectable()
export default class MemoryDatabase<T extends Entity, K extends EntityIntf> extends NedbDatabase<
  T,
  K
> {
  constructor(
    protected readonly clazz: new (...args: any[]) => T,
    protected readonly classDescriminatorFn?: (entity: K) => new (...args: any[]) => T,
  ) {
    super(
      {
        inMemoryOnly: true,
      },
      clazz,
      classDescriminatorFn,
    );
  }
}
