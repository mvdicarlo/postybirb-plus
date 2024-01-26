import _ from 'lodash';
import { DescriptionData, TagData } from 'postybirb-commons';

export default class FormContent {
  private constructor() {}

  static getTags(defaultTags: TagData, websiteTags: TagData): string[] {
    const extendDefault: boolean = _.get(websiteTags, 'extendDefault', true);
    return extendDefault
      ? [..._.get(websiteTags, 'value', []), ..._.get(defaultTags, 'value', [])]
      : [..._.get(websiteTags, 'value', [])];
  }

  static getDescription(
    defaultDescription: DescriptionData,
    websiteDescription: DescriptionData,
  ): string {
    const overwriteDefault: boolean = _.get(websiteDescription, 'overwriteDefault', false);
    return overwriteDefault
      ? _.get(websiteDescription, 'value', '')
      : _.get(defaultDescription, 'value', '');
  }

  static getSpoilerText(
    defaultData: { spoilerText?: string },
    partData: { spoilerText?: string; spoilerTextOverwrite?: boolean },
  ): string {
    const partSpoilerText = partData.spoilerText || '';
    const overwrite =
      partData.spoilerTextOverwrite === undefined
        ? partSpoilerText.trim() !== ''
        : partData.spoilerTextOverwrite;
    if (overwrite) {
      return partSpoilerText;
    } else {
      return defaultData.spoilerText || '';
    }
  }
}
