import { Test } from '@nestjs/testing';
import { TagGroupService } from './tag-group.service';
import { TagGroupRepositoryToken } from './tag-group.repository';
import MemoryDatabase from 'src/server/database/databases/memory.database';
import TagGroupEntity from './models/tag-group.entity';
import { TagGroup } from './interfaces/tag-group.interface';
import { mockEventEmitterProvider } from 'test/common';

describe('TagGroupService', () => {
  let service: TagGroupService;
  let entity: TagGroupEntity;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TagGroupService,
        mockEventEmitterProvider,
        {
          provide: TagGroupRepositoryToken,
          useValue: new MemoryDatabase<TagGroupEntity, TagGroup>(TagGroupEntity),
        },
      ],
    }).compile();

    service = moduleRef.get<TagGroupService>(TagGroupService);
  });

  beforeEach(() => {
    entity = new TagGroupEntity({
      _id: `test-${Date.now()}`,
      alias: 'create',
      tags: ['test'],
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
    const newTags = ['test', 'updated'];
    found.tags = newTags;
    await service.update(found);
    const found2 = await service.get(entity._id);
    expect(found2.tags.length).toBe(2);
    for (const tag of newTags) {
      expect(found2.tags.includes(tag)).toBeTruthy();
    }
  });

  it('should delete', async () => {
    await service.create(entity);
    await service.remove(entity._id);
    await expect(service.get(entity._id)).rejects.toBeDefined();
  });
});
