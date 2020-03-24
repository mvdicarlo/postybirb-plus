import FileSize from './filesize.util';

describe('FileSize', () => {
  it('should be 4MB', () => {
    expect(FileSize.MBtoBytes(4)).toEqual(4194304);
  });
});
