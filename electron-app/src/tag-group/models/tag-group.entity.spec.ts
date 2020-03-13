import TagGroupEntity from './tag-group.entity';
import { validateOrReject } from 'class-validator';
import { classToPlain, plainToClass } from 'class-transformer';
import { TagGroup } from '../interfaces/tag-group.interface';

describe('TagGroupEntity', () => {
  let plain: TagGroup;

  beforeEach(() => {
    plain = {
      _id: 'id',
      alias: 'alias',
      tags: ['test'],
      created: Date.now(),
    };
  });

  describe('validate', () => {
    it('should be valid', async () => {
      const entity = new TagGroupEntity(plain);
      expect(validateOrReject(entity)).resolves.toBeUndefined();
    });

    it('should be invalid', async () => {
      const entity = new TagGroupEntity({
        alias: null,
        tags: null,
      });

      await expect(validateOrReject(entity)).rejects.toBeDefined();
    });

    it('should be invalid when empty', async () => {
      await expect(validateOrReject(new TagGroupEntity())).rejects.toBeDefined();
    });
  });

  describe('transform', () => {
    it('should convert to class', async () => {
      const entity = plainToClass(TagGroupEntity, plain);
      expect(entity instanceof TagGroupEntity).toBe(true);
      Object.keys(plain).forEach(key => {
        expect(entity[key]).toEqual(plain[key]);
      });
    });

    it('should convert to plain', async () => {
      const entity = plainToClass(TagGroupEntity, plain);
      const converted = classToPlain(entity);
      expect(converted === plain).toEqual(false);
      Object.keys(plain).forEach(key => {
        expect(converted[key]).toEqual(plain[key]);
      });
    });
  });
});
