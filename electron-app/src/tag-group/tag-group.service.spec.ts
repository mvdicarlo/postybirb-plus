import { Test } from '@nestjs/testing';
import { TagGroupService } from './tag-group.service';
import { TagGroupDatabaseToken } from './tag-group.repository';
import MemoryDatabase from 'src/database/databases/memory.database';
import TagGroupEntity from './models/tag-group.entity';
import { TagGroup } from './interfaces/tag-group.interface';
import { mockEventEmitterProvider } from 'test/common';

describe('TagGroupService', () => {
  let tagGroupService: TagGroupService;
  let entity: TagGroupEntity;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TagGroupService,
        mockEventEmitterProvider,
        {
          provide: TagGroupDatabaseToken,
          useValue: new MemoryDatabase<TagGroupEntity, TagGroup>(TagGroupEntity),
        },
      ],
    }).compile();

    tagGroupService = moduleRef.get<TagGroupService>(TagGroupService);
  });

  beforeEach(() => {
    entity = new TagGroupEntity({
      _id: `test-${Date.now()}`,
      alias: 'create',
      tags: ['test'],
    });
  });

  it('should create a tag group', async () => {
    await tagGroupService.create(entity);
    expect((await tagGroupService.getAll()).length).toBeGreaterThan(0);
  });

  it('should create and update a tag group', async () => {
    await tagGroupService.create(entity);
    const found = await tagGroupService.get(entity._id);
    const newTags = ['test', 'updated'];
    found.tags = newTags;
    await tagGroupService.update(found);
    const found2 = await tagGroupService.get(entity._id);
    expect(found2.tags.length).toBe(2);
    for (const tag of newTags) {
      expect(found2.tags.includes(tag)).toBeTruthy();
    }
  });

  it('should delete a tag group', async () => {
    await tagGroupService.create(entity);
    await tagGroupService.remove(entity._id);
    await expect(tagGroupService.get(entity._id)).rejects.toBeDefined();
  });
});
