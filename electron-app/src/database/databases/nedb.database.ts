import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as Datastore from 'nedb';
import * as util from 'util';
import { validateOrReject } from 'class-validator';
import { classToPlain } from 'class-transformer';
import Entity from '../models/entity.model';
import { EntityIntf } from '../interfaces/entity.interface';
import { Database } from '../database.abstract';

export default abstract class NedbDatabase<T extends Entity, K extends EntityIntf> extends Database<
  T,
  K
> {
  protected readonly db: Datastore;
  protected _find: Function;
  protected _findOne: Function;
  protected _remove: Function;
  protected _insert: Function;
  protected _update: Function;

  constructor(
    protected readonly databaseOptions: object,
    protected readonly clazz: new (...args: any[]) => T,
    protected readonly classDescriminatorFn?: (entity: K) => new (...args: any[]) => T,
  ) {
    super(clazz, classDescriminatorFn);
    this.db = new Datastore(databaseOptions);

    this._find = util.promisify(this.db.find.bind(this.db));
    this._findOne = util.promisify(this.db.findOne.bind(this.db));
    this._remove = util.promisify(this.db.remove.bind(this.db));
    this._insert = util.promisify(this.db.insert.bind(this.db));
    this._update = util.promisify(this.db.update.bind(this.db));
  }

  async find(search?: any): Promise<T[]> {
    const docs = await this._find(search || {});
    return docs.map(doc => this.constructEntity(doc));
  }

  async findOne(id: string): Promise<T> {
    const doc = await this._findOne({ _id: id });
    return this.constructEntity(doc);
  }

  async remove(id: string): Promise<number> {
    try {
      return await this._remove({ _id: id }, { multi: false });
    } catch (err) {
      throw new BadRequestException(err);
    } finally {
      this.db.persistence.compactDatafile();
    }
  }

  async removeAll(): Promise<number> {
    try {
      return await this._remove({}, { multi: true });
    } catch (err) {
      throw new BadRequestException(err);
    } finally {
      this.db.persistence.compactDatafile();
    }
  }

  async removeBy(search: object): Promise<number> {
    try {
      return await this._remove(search, { multi: true });
    } catch (err) {
      throw new BadRequestException(err);
    } finally {
      this.db.persistence.compactDatafile();
    }
  }

  async save(entity: T): Promise<T> {
    try {
      await validateOrReject(entity);
      const obj = classToPlain<T>(entity) as EntityIntf;
      obj.created = Date.now();
      const savedEntity = await this._insert(obj);
      return this.constructEntity(savedEntity);
    } catch (err) {
      throw new BadRequestException(err);
    } finally {
      this.db.persistence.compactDatafile();
    }
  }

  async update(entity: T): Promise<number> {
    try {
      await validateOrReject(entity);
      const obj = classToPlain<T>(entity) as EntityIntf;
      // Disallow id updates
      delete obj._id;
      const updatedCount = await this._update(
        { _id: entity._id },
        {
          $set: {
            ...obj,
            lastUpdated: Date.now(),
          },
        },
        { upsert: false, multi: false },
      );
      return updatedCount;
    } catch (err) {
      throw new BadRequestException(err);
    } finally {
      this.db.persistence.compactDatafile();
    }
  }

  count(query?: any): Promise<number> {
    return new Promise(resolve => {
      this.db.count(query || {}, (err, count) => resolve(count));
    });
  }
}
