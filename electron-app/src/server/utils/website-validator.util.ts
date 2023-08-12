import { FileRecord, Folder } from 'postybirb-commons';

import path from 'path';

export default class WebsiteValidator {
  private constructor() {}

  static supportsFileType(fileInfo: FileRecord, supportedFileTypes: string[]): boolean {
    const split = fileInfo.mimetype.split('/')[1];
    let extension = null;
    if (fileInfo.name) {
      extension = path
        .extname(fileInfo.name)
        .replace('.', '')
        .toLowerCase();
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
    if (!folders) return false;
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
