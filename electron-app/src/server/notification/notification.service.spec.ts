import { Test } from '@nestjs/testing';
import MemoryDatabase from 'src/server/database/databases/memory.database';
import { mockEventEmitterProvider } from 'test/common';
import PostyBirbNotificationEntity from './models/postybirb-notification.entity';
import { NotificationService } from './notification.service';
import { PostyBirbNotification } from './interfaces/postybirb-notification.interface';
import { NotificationRepositoryToken } from './notification.repository';

describe('NotificationService', () => {
  let service: NotificationService;
  let entity: PostyBirbNotificationEntity;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationService,
        mockEventEmitterProvider,
        {
          provide: NotificationRepositoryToken,
          useValue: new MemoryDatabase<PostyBirbNotificationEntity, PostyBirbNotification>(
            PostyBirbNotificationEntity,
          ),
        },
      ],
    }).compile();

    service = moduleRef.get<NotificationService>(NotificationService);
  });

  beforeEach(() => {
    entity = new PostyBirbNotificationEntity({
      _id: `test-${Date.now()}`,
      title: 'title',
      body: 'body',
      type: 'INFO',
    });
  });

  it('should create', async () => {
    await service.create(entity);
    const found = await service.get(entity._id);
    delete found.created;
    expect(found).toEqual(entity);
  });

  it('should create and mark as viewed', async () => {
    await service.create(entity);
    let found = await service.get(entity._id);
    expect(found.viewed).toBeFalsy();

    await service.markAsViewed([entity._id]);
    found = await service.get(entity._id);
    expect(found.viewed).toBeTruthy();
  });

  it('should delete', async () => {
    await service.create(entity);
    await service.remove(entity._id);
    await expect(service.get(entity._id)).rejects.toBeDefined();
  });

  it('should delete all', async () => {
    await service.create(entity);
    let all = await service.getAll();
    expect(all.length).toBeGreaterThan(0);

    await service.removeAll();
    all = await service.getAll();
    expect(all.length).toBe(0);
  });
});
