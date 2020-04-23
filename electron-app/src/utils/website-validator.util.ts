import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import { Folder } from 'src/websites/interfaces/folder.interface';

export default class WebsiteValidator {
  private constructor() {}

  static supportsFileType(fileInfo: FileRecord, supportedFileTypes: string[]): boolean {
    const split = fileInfo.mimetype.split('/')[1];
    let extension = null;
    if (fileInfo.name) {
      extension = fileInfo.name.split('.').pop();
    }

    for (const type of supportedFileTypes) {
      if ((fileInfo.type && type.includes(fileInfo.type)) || (split && type.includes(split))) {
        return true;
      } else if (extension && type.includes(extension)) {
        return true;
      }
    }

    return false;
  }

  static folderIdExists(id: string, folders: Folder[]): boolean {
    for (const folder of folders) {
      if (folder.value === id) {
        return true;
      }
      if (folder.children) {
        if (WebsiteValidator.folderIdExists(id, folder.children)) {
          return true;
        }
      }
    }
    return false;
  }
}
