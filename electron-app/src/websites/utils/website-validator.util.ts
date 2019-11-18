import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';

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

  static MBtoBytes(size: any): number {
    return Number(size) * (1024 ** 2);
  }
}
