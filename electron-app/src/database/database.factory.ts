import PersistedDatabase from './databases/persisted.database';
import MemoryDatabase from './databases/memory.database';
import Entity from './models/entity.model';
import { EntityIntf } from './interfaces/entity.interface';
import NedbDatabase from './databases/nedb.database';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';

interface DatabaseFactoryOptions<T, K> {
  descriminator?: (entity: K) => new (...args: any[]) => T;
  entity: new (...args: any[]) => T;
  databaseName?: string;
}

export class DatabaseFactory {
  private constructor() {}

  public static forProvider<T extends Entity, K extends EntityIntf>(
    provide: any,
    options: DatabaseFactoryOptions<T, K>,
  ): Provider<NedbDatabase<T, K>> {
    return {
      provide,
      useValue: options.databaseName
        ? DatabaseFactory.persisted<T, K>(options)
        : DatabaseFactory.memory<T, K>(options),
    };
  }

  public static memory<T extends Entity, K extends EntityIntf>(
    options: DatabaseFactoryOptions<T, K>,
  ): NedbDatabase<T, K> {
    return new MemoryDatabase<T, K>(options.entity, options.descriminator);
  }

  public static persisted<T extends Entity, K extends EntityIntf>(
    options: DatabaseFactoryOptions<T, K>,
  ): NedbDatabase<T, K> {
    return new PersistedDatabase<T, K>(
      options.databaseName,
      options.entity,
      options.descriminator,
    );
  }
}
