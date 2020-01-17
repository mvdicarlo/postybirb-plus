import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DATABASE_DIRECTORY } from 'src/directories';
import * as path from 'path';
import * as Datastore from 'nedb';
import * as util from 'util';
import { validate } from 'class-validator';
import { classToPlain } from 'class-transformer';
import Entity from './entity.base';
import { EntityIntf } from './entity.base.interface';

export default abstract class EntityRepository<T extends Entity, K extends EntityIntf> {
  protected readonly db: Datastore;
  protected _find: Function;
  protected _findOne: Function;
  protected _remove: Function;
  protected _insert: Function;
  protected _update: Function;

  constructor(
    private readonly databaseName: string,
    private readonly clazz: new (...args: any[]) => T,
    private readonly classDescriminatorFn?: (entity: K) => new (...args: any[]) => T,
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
      return docs.map(doc => this.constructEntity(doc));
    } catch (err) {
      throw new NotFoundException(err);
    } finally {
      this.db.persistence.compactDatafile();
    }
  }

  async findOne(id: string): Promise<T> {
    try {
      const doc = await this._findOne({ _id: id });
      return this.constructEntity(doc);
    } catch (err) {
      throw new NotFoundException(err);
    }
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
      await validate(entity);
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
      await validate(entity);
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

  private constructEntity(entity: K): T {
    if (!entity) {
      return null;
    }

    let newFn = this.clazz;
    if (this.classDescriminatorFn) {
      newFn = this.classDescriminatorFn(entity);
    }

    return new newFn(entity);
  }
}
