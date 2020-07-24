import UserAccountEntity from './user-account.entity';
import { validateOrReject } from 'class-validator';
import { classToPlain, plainToClass } from 'class-transformer';
import { UserAccount } from '../interfaces/user-account.interface';

describe('UserAccountEntity', () => {
  let plain: UserAccount;

  beforeEach(() => {
    plain = {
      _id: 'id',
      alias: 'alias',
      data: {},
      website: 'website',
      created: Date.now(),
    };
  });

  describe('validate', () => {
    it('should be valid', async () => {
      const entity = new UserAccountEntity(plain);
      await expect(validateOrReject(entity)).resolves.toBeUndefined();
    });

    it('should be invalid', async () => {
      const entity = new UserAccountEntity({
        alias: null,
        data: {},
        website: null,
      });

      await expect(validateOrReject(entity)).rejects.toBeDefined();
    });

    it('should be invalid when empty', async () => {
      await expect(validateOrReject(new UserAccountEntity())).rejects.toBeDefined();
    });
  });

  describe('transform', () => {
    it('should convert to class', async () => {
      const entity = plainToClass(UserAccountEntity, plain);
      expect(entity instanceof UserAccountEntity).toBe(true);
      expect(entity).toEqual(plain);
    });

    it('should convert to plain', async () => {
      const entity = plainToClass(UserAccountEntity, plain);
      const converted = classToPlain(entity);
      expect(converted === plain).toBe(false);
      expect(plain).toEqual(converted);
    });
  });
});
