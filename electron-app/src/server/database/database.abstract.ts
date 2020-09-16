import Entity from './models/entity.model';
import { EntityIntf } from 'postybirb-commons';

export abstract class Database<T extends Entity, K extends EntityIntf> {
  constructor(
    protected readonly clazz: new (...args: any[]) => T,
    protected readonly classDescriminatorFn?: (entity: K) => new (...args: any[]) => T,
  ) {}

  abstract count(query?: any): Promise<number>;
  abstract find(search?: any): Promise<T[]>;
  abstract findOne(id: string): Promise<T>;
  abstract remove(id: string): Promise<number>;
  abstract removeAll(): Promise<number>;
  abstract removeBy(search: object): Promise<number>;
  abstract save(entity: T): Promise<T>;
  abstract update(entity: T): Promise<number>;

  protected constructEntity(entity: K): T {
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
