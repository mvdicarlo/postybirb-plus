export default class FileSize {
  private constructor() {}

  static MBtoBytes(size: number): number {
    return size * 1048576;
  }
}
