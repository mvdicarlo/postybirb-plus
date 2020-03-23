import { validateOrReject } from 'class-validator';
import { classToPlain, plainToClass } from 'class-transformer';
import { TagConverter } from '../interfaces/tag-converter.interface';
import TagConverterEntity from './tag-converter.entity';

describe('TagConverterEntity', () => {
  let plain: TagConverter;

  beforeEach(() => {
    plain = {
      _id: 'id',
      tag: 'alias',
      conversions: { FurAffinity: 'hello' },
      created: Date.now(),
    };
  });

  describe('validate', () => {
    it('should be valid', async () => {
      const entity = new TagConverterEntity(plain);
      expect(validateOrReject(entity)).resolves.toBeUndefined();
    });

    it('should be invalid', async () => {
      const entity = new TagConverterEntity({
        tag: null,
      });

      await expect(validateOrReject(entity)).rejects.toBeDefined();
    });

    it('should be invalid when empty', async () => {
      await expect(validateOrReject(new TagConverterEntity())).rejects.toBeDefined();
    });
  });

  describe('transform', () => {
    it('should convert to class', async () => {
      const entity = plainToClass(TagConverterEntity, plain);
      expect(entity instanceof TagConverterEntity).toBe(true);
      expect(entity).toEqual(plain);
    });

    it('should convert to plain', async () => {
      const entity = plainToClass(TagConverterEntity, plain);
      const converted = classToPlain(entity);
      expect(converted === plain).toBe(false);
      expect(plain).toEqual(converted);
    });
  });

  describe('functionality', () => {
    it('should retrieve correct tag conversion', () => {
      const entity = plainToClass(TagConverterEntity, plain);
      expect(entity.hasConversion('FurAffinity')).toBeTruthy();
      expect(entity.getTagForWebsite('FurAffinity')).toBe('hello');
    });
  });
});
