import { validateOrReject } from 'class-validator';
import { classToPlain, plainToClass } from 'class-transformer';
import CustomShortcutEntity from './custom-shortcut.entity';
import { CustomShortcut } from '../interfaces/custom-shortcut.interface';

describe('CustomShortcutEntity', () => {
  let plain: CustomShortcut;

  beforeEach(() => {
    plain = {
      _id: 'id',
      shortcut: 'alias',
      content: 'content',
      isStatic: false,
      created: Date.now(),
    };
  });

  describe('validate', () => {
    it('should be valid', async () => {
      const entity = new CustomShortcutEntity(plain);
      expect(validateOrReject(entity)).resolves.toBeUndefined();
    });

    it('should be invalid', async () => {
      const entity = new CustomShortcutEntity({
        content: null,
      });

      await expect(validateOrReject(entity)).rejects.toBeDefined();
    });

    it('should be invalid when empty', async () => {
      await expect(validateOrReject(new CustomShortcutEntity())).rejects.toBeDefined();
    });
  });

  describe('transform', () => {
    it('should convert to class', async () => {
      const entity = plainToClass(CustomShortcutEntity, plain);
      expect(entity instanceof CustomShortcutEntity).toBe(true);
      expect(entity).toEqual(plain);
    });

    it('should convert to plain', async () => {
      const entity = plainToClass(CustomShortcutEntity, plain);
      const converted = classToPlain(entity);
      expect(converted === plain).toBe(false);
      expect(plain).toEqual(converted);
    });
  });
});
