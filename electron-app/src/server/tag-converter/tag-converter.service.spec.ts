import { Test } from '@nestjs/testing';
import { mockEventEmitterProvider } from 'test/common';
import MemoryDatabase from 'src/server/database/databases/memory.database';
import { TagConverterService } from './tag-converter.service';
import TagConverterEntity from './models/tag-converter.entity';
import { TagConverterRepositoryToken } from './tag-converter.repository';
import { TagConverter } from './interfaces/tag-converter.interface';

describe('TagConverterService', () => {
  let service: TagConverterService;
  let entity: TagConverterEntity;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TagConverterService,
        mockEventEmitterProvider,
        {
          provide: TagConverterRepositoryToken,
          useValue: new MemoryDatabase<TagConverterEntity, TagConverter>(TagConverterEntity),
        },
      ],
    }).compile();

    service = moduleRef.get<TagConverterService>(TagConverterService);
  });

  beforeEach(() => {
    entity = new TagConverterEntity({
      _id: `test-${Date.now()}`,
      tag: `test`,
      conversions: {},
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
    const newTag = 'updated';
    found.tag = newTag;
    await service.update(found);
    const found2 = await service.get(entity._id);
    expect(found2.tag).toEqual(newTag);
  });

  it('should delete', async () => {
    await service.create(entity);
    await service.remove(entity._id);
    await expect(service.get(entity._id)).rejects.toBeDefined();
  });
});
