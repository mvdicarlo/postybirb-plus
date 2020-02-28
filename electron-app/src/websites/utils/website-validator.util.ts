import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import * as _ from 'lodash';
import { DescriptionData } from 'src/submission/submission-part/interfaces/description-data.interface';
import { TagData } from 'src/submission/submission-part/interfaces/tag-data.interface';

export default class WebsiteValidator {
  static supportsFileType(fileInfo: FileRecord, supportedFileTypes: string[]): boolean {
    const split = fileInfo.mimetype.split('/')[1];
    let extension = null;
    if (fileInfo.name) {
      extension = fileInfo.name.split('.').pop();
    }

    for (let i = 0; i < supportedFileTypes.length; i++) {
      if (
        (fileInfo.type && supportedFileTypes[i].includes(fileInfo.type)) ||
        (split && supportedFileTypes[i].includes(split))
      ) {
        return true;
      } else {
        if (extension && supportedFileTypes[i].includes(extension)) {
          return true;
        }
      }
    }

    return false;
  }

  static getTags(defaultTags: TagData, websiteTags: TagData): string[] {
    const extendDefault: boolean = _.get(websiteTags, 'extendDefault', true);
    return extendDefault
      ? [..._.get(websiteTags, 'value', []), ...defaultTags.value]
      : [..._.get(websiteTags, 'value', [])];
  }

  static getDescription(
    defaultDescription: DescriptionData,
    websiteDescription: DescriptionData,
  ): string {
    const overwriteDefault: boolean = _.get(websiteDescription, 'overwriteDefault', false);
    return overwriteDefault ? _.get(websiteDescription, 'value', '') : defaultDescription.value;
  }
}
