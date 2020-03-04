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
      expect(validateOrReject(entity)).resolves.toBeUndefined();
    });

    it('should be invalid', async () => {
      const entity = new UserAccountEntity({
        alias: null,
        data: {},
        website: null,
      });

      expect(validateOrReject(entity)).rejects.toBeDefined();
    });

    it('should be invalid when empty', async () => {
      expect(validateOrReject(new UserAccountEntity())).rejects.toBeDefined();
    });
  });

  describe('transform', () => {
    it('should convert to class', async () => {
      const entity = plainToClass(UserAccountEntity, plain);
      expect(entity instanceof UserAccountEntity).toBe(true);
      Object.keys(plain).forEach(key => {
        expect(entity[key]).toEqual(plain[key]);
      });
    });

    it('should convert to plain', async () => {
      const entity = plainToClass(UserAccountEntity, plain);
      const converted = classToPlain(entity);
      expect(converted === plain).toEqual(false);
      Object.keys(plain).forEach(key => {
        expect(converted[key]).toEqual(plain[key]);
      });
    });
  });
});
