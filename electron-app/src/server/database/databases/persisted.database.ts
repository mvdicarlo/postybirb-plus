import { Injectable } from '@nestjs/common';
import { DATABASE_DIRECTORY } from 'src/server/directories';
import path from 'path';
import Entity from '../models/entity.model';
import { EntityIntf } from 'postybirb-commons';
import NedbDatabase from './nedb.database';

@Injectable()
export default class PersistedDatabase<T extends Entity, K extends EntityIntf> extends NedbDatabase<
  T,
  K
> {
  constructor(
    private readonly databaseName: string,
    protected readonly clazz: new (...args: any[]) => T,
    protected readonly classDescriminatorFn?: (entity: K) => new (...args: any[]) => T,
  ) {
    super(
      {
        filename: path.join(DATABASE_DIRECTORY, `${databaseName}.db`),
        autoload: true,
      },
      clazz,
      classDescriminatorFn,
    );
  }
}
