import { Test } from '@nestjs/testing';
import MemoryDatabase from 'src/server/database/databases/memory.database';
import { mockEventEmitterProvider } from 'test/common';
import { DescriptionTemplateService } from './description-template.service';
import DescriptionTemplateEntity from './models/description-template.entity';
import { DescriptionTemplateRepositoryToken } from './description-template.repository';
import { DescriptionTemplate } from './interfaces/description-template.interface';

describe('DescriptionTemplateService', () => {
  let service: DescriptionTemplateService;
  let entity: DescriptionTemplateEntity;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DescriptionTemplateService,
        mockEventEmitterProvider,
        {
          provide: DescriptionTemplateRepositoryToken,
          useValue: new MemoryDatabase<DescriptionTemplateEntity, DescriptionTemplate>(
            DescriptionTemplateEntity,
          ),
        },
      ],
    }).compile();

    service = moduleRef.get<DescriptionTemplateService>(DescriptionTemplateService);
  });

  beforeEach(() => {
    entity = new DescriptionTemplateEntity({
      _id: `test-${Date.now()}`,
      title: 'create',
      content: 'content',
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
