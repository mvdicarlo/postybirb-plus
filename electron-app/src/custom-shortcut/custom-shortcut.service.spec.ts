import { Test } from '@nestjs/testing';
import { CustomShortcutService } from './custom-shortcut.service';
import { CustomShortcutRepositoryToken } from './custom-shortcut.repository';
import CustomShortcutEntity from './models/custom-shortcut.entity';
import { mockEventEmitterProvider } from 'test/common';
import MemoryDatabase from 'src/database/databases/memory.database';
import { CustomShortcut } from './interfaces/custom-shortcut.interface';

describe('CustomShortcutService', () => {
  let service: CustomShortcutService;
  let entity: CustomShortcutEntity;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CustomShortcutService,
        mockEventEmitterProvider,
        {
          provide: CustomShortcutRepositoryToken,
          useValue: new MemoryDatabase<CustomShortcutEntity, CustomShortcut>(CustomShortcutEntity),
        },
      ],
    }).compile();

    service = moduleRef.get<CustomShortcutService>(CustomShortcutService);
  });

  beforeEach(() => {
    entity = new CustomShortcutEntity({
      _id: `test-${Date.now()}`,
      shortcut: `test-${Date.now()}`,
      content: 'content',
      isDynamic: false,
    });
  });

  it('should create', async () => {
    await service.create(entity);
    const found = await service.get(entity._id);
    delete found.created;
    expect(found).toEqual(entity);
  });

  it('should create and update', async () => {
    await service.create(entity);
    const found = await service.get(entity._id);
    const newContent = 'updated content';
    found.content = newContent;
    await service.update(found);
    const found2 = await service.get(entity._id);
    expect(found2.content).toEqual(newContent);
  });

  it('should delete', async () => {
    await service.create(entity);
    await service.remove(entity._id);
    await expect(service.get(entity._id)).rejects.toBeDefined();
  });
});
