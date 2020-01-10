import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DATABASE_DIRECTORY } from 'src/directories';
import * as path from 'path';
import * as Datastore from 'nedb';
import * as util from 'util';
import { validate } from 'class-validator';
import { classToPlain } from 'class-transformer';
import Entity from './entity.base';
import { EntityIntf } from './entity.base.interface';

export default class EntityRepository<T extends Entity> {
  protected readonly db: Datastore;
  protected _find: Function;
  protected _findOne: Function;
  protected _remove: Function;
  protected _insert: Function;
  protected _update: Function;

  constructor(
    private readonly databaseName: string,
    private readonly clazz: new (...args: any[]) => T,
  ) {
    this.db = new Datastore({
      filename: path.join(DATABASE_DIRECTORY, `${databaseName}.db`),
      autoload: true,
    });

    this._find = util.promisify(this.db.find.bind(this.db));
    this._findOne = util.promisify(this.db.findOne.bind(this.db));
    this._remove = util.promisify(this.db.remove.bind(this.db));
    this._insert = util.promisify(this.db.insert.bind(this.db));
    this._update = util.promisify(this.db.update.bind(this.db));
  }

  async find(search?: any): Promise<T[]> {
    try {
      const docs = await this._find(search || {});
      return docs.map(doc => new this.clazz(doc));
    } catch (err) {
      throw new NotFoundException(err);
    }
  }

  async findOne(id: string): Promise<T> {
    try {
      const doc = await this._findOne({ _id: id });
      return new this.clazz(doc);
    } catch (err) {
      throw new NotFoundException(err);
    }
  }

  async remove(id: string): Promise<number> {
    try {
      return await this._remove({ _id: id }, { multi: false });
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async save(entity: T): Promise<T> {
    try {
      await validate(entity);
      const obj = classToPlain<T>(entity) as EntityIntf;
      obj.created = new Date().toLocaleString();
      const savedEntity = await this._insert(obj);
      return new this.clazz(savedEntity);
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async update(entity: T): Promise<number> {
    try {
      await validate(entity);
      const obj = classToPlain<T>(entity) as EntityIntf;
      // Disallow id updates
      delete obj._id;
      delete obj.id;
      const updatedCount = await this._update(
        { _id: entity._id },
        {
          $set: {
            ...obj,
            lastUpdated: new Date().toLocaleString(),
          },
        },
        {},
      );
      return updatedCount;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }
}
