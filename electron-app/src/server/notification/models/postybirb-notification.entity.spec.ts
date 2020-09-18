import { validateOrReject } from 'class-validator';
import { classToPlain, plainToClass } from 'class-transformer';
import { PostyBirbNotification } from 'postybirb-commons';
import PostyBirbNotificationEntity from './postybirb-notification.entity';
import { NotificationType } from '../enums/notification-type.enum';

describe('PostyBirbNotificationEntity', () => {
  let plain: PostyBirbNotification;

  beforeEach(() => {
    plain = {
      _id: 'id',
      type: 'SUCCESS',
      title: 'title',
      body: 'body',
      created: Date.now(),
    };
  });

  describe('validate', () => {
    it('should be valid', async () => {
      const entity = new PostyBirbNotificationEntity(plain);
      await expect(validateOrReject(entity)).resolves.toBeUndefined();
    });

    it('should be invalid', async () => {
      const entity = new PostyBirbNotificationEntity({
        title: null,
        body: null,
        type: NotificationType.SUCCESS,
      });

      await expect(validateOrReject(entity)).rejects.toBeDefined();
    });

    it('should be invalid when empty', async () => {
      await expect(validateOrReject(new PostyBirbNotificationEntity())).rejects.toBeDefined();
    });
  });

  describe('transform', () => {
    it('should convert to class', async () => {
      const entity = plainToClass(PostyBirbNotificationEntity, plain);
      expect(entity instanceof PostyBirbNotificationEntity).toBe(true);
      expect(entity).toEqual(plain);
    });

    it('should convert to plain', async () => {
      const entity = plainToClass(PostyBirbNotificationEntity, plain);
      const converted = classToPlain(entity);
      expect(converted === plain).toBe(false);
      expect(plain).toEqual(converted);
    });
  });
});
