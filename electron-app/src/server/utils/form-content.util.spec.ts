import { DescriptionData, TagData } from 'postybirb-commons';
import FormContent from './form-content.util';

describe('FormContent', () => {
  describe('Description', () => {
    const defaultDescription: DescriptionData = {
      overwriteDefault: false,
      value: 'Default',
    };

    const overwriteDescription: DescriptionData = {
      overwriteDefault: true,
      value: 'Overwrite',
    };

    it('should retrieve default description', () => {
      let description = FormContent.getDescription(null, null);
      expect(description).toEqual('');

      description = FormContent.getDescription(defaultDescription, null);
      expect(description).toEqual(defaultDescription.value);
    });

    it('should retrieve overwritten description', () => {
      let description = FormContent.getDescription(null, overwriteDescription);
      expect(description).toEqual('Overwrite');

      description = FormContent.getDescription(defaultDescription, overwriteDescription);
      expect(description).toEqual(overwriteDescription.value);
    });
  });

  describe('Tags', () => {
    const defaultTags: TagData = {
      extendDefault: true,
      value: ['test'],
    };

    const extendTags: TagData = {
      extendDefault: true,
      value: ['extend'],
    };

    const ignoreDefaultTags: TagData = {
      extendDefault: false,
      value: ['unique'],
    };

    it('should extend tags', () => {
      let tags = FormContent.getTags(null, null);
      expect(tags.length).toEqual(0);

      tags = FormContent.getTags(defaultTags, extendTags);
      expect(tags.length).toEqual(2);
    });

    it('should ignore default tags', () => {
      const tags = FormContent.getTags(defaultTags, ignoreDefaultTags);
      expect(tags.length).toEqual(1);
    });
  });
});
