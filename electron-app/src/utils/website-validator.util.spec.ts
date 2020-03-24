import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import WebsiteValidator from './website-validator.util';

describe('WebsiteValidator', () => {
  const file: FileRecord = {
    location: '',
    mimetype: 'image/jpeg',
    name: 'image.jpeg',
    preview: '',
    size: 0,
    type: null,
  };

  it('should return true', () => {
    expect(WebsiteValidator.supportsFileType(file, ['image/jpeg'])).toBeTruthy();
    expect(WebsiteValidator.supportsFileType(file, ['jpeg'])).toBeTruthy();
  });

  it('should return false', () => {
    expect(WebsiteValidator.supportsFileType(file, ['png'])).toBeFalsy();
  });
});
