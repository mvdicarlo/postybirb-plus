import { validateOrReject } from 'class-validator';
import { classToPlain, plainToClass } from 'class-transformer';
import { DescriptionTemplate } from '../interfaces/description-template.interface';
import DescriptionTemplateEntity from './description-template.entity';

describe('DescriptionTemplateEntity', () => {
  let plain: DescriptionTemplate;

  beforeEach(() => {
    plain = {
      _id: 'id',
      title: 'alias',
      content: 'content',
      created: Date.now(),
    };
  });

  describe('validate', () => {
    it('should be valid', async () => {
      const entity = new DescriptionTemplateEntity(plain);
      expect(validateOrReject(entity)).resolves.toBeUndefined();
    });

    it('should be invalid', async () => {
      const entity = new DescriptionTemplateEntity({
        content: null,
        title: null,
      });

      await expect(validateOrReject(entity)).rejects.toBeDefined();
    });

    it('should be invalid when empty', async () => {
      await expect(validateOrReject(new DescriptionTemplateEntity())).rejects.toBeDefined();
    });
  });

  describe('transform', () => {
    it('should convert to class', async () => {
      const entity = plainToClass(DescriptionTemplateEntity, plain);
      expect(entity instanceof DescriptionTemplateEntity).toBe(true);
      Object.keys(plain).forEach(key => {
        expect(entity[key]).toEqual(plain[key]);
      });
    });

    it('should convert to plain', async () => {
      const entity = plainToClass(DescriptionTemplateEntity, plain);
      const converted = classToPlain(entity);
      expect(converted === plain).toEqual(false);
      Object.keys(plain).forEach(key => {
        expect(converted[key]).toEqual(plain[key]);
      });
    });
  });
});
