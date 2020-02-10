import { nativeImage } from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as filesize from 'filesize';
import * as decode from 'image-decode';
import * as encode from 'image-encode';

type MimeType = 'image/jpeg' | 'image/jpeg' | 'image/png' | 'image/tiff' | 'image/bmp';

export default class ImageManipulator {
  private originalMimeType: MimeType;
  private mimeType: MimeType;
  private hasAlpha: boolean;
  private buffer: Buffer;
  private jpegQuality: number = 100;
  private height: number;
  private width: number;
  private cachedNImage: Electron.NativeImage;
  private _ni: Electron.NativeImage;

  private get nImage(): Electron.NativeImage {
    if (this.cachedNImage) {
      return this.cachedNImage;
    }
    return this._ni;
  }

  private constructor(buffer: Buffer, mimeType: MimeType, hasAlpha: boolean) {
    this.buffer = buffer;
    this._ni = nativeImage.createFromBuffer(buffer);
    this.mimeType = hasAlpha ? mimeType : 'image/jpeg';
    this.originalMimeType = mimeType;
    this.hasAlpha = hasAlpha;
  }

  static build(buffer: Buffer, mimeType: MimeType, skipConversion?: boolean): ImageManipulator {
    let hasAlpha: boolean = false;
    if (!skipConversion) {
      if (mimeType === 'image/tiff' || mimeType === 'image/bmp') {
        const { data, width, height } = decode(buffer, mimeType);
        hasAlpha = ImageManipulator.hasAlpha(data);
        mimeType = hasAlpha ? 'image/png' : 'image/jpeg';

        buffer = Buffer.from(
          encode(data, {
            width,
            height,
            format: mimeType,
            quality: 100,
          }),
        );
      }
    }

    return new ImageManipulator(buffer, mimeType, hasAlpha);
  }

  static hasAlpha(data: Buffer): boolean {
    const rgbaCount = data.length / 4;
    for (let i = 0; i < rgbaCount; i++) {
      const a = data[i * 4 + 3];
      if (!a) {
        return true;
      }
    }
    return false;
  }

  static isMimeType(mimeType: string): mimeType is MimeType {
    return (
      mimeType === 'image/png' ||
      mimeType === 'image/jpeg' ||
      mimeType === 'image/tiff' ||
      mimeType === 'image/bmp'
    );
  }

  getNativeImage(): Electron.NativeImage {
    return this.nImage;
  }

  getBuffer(): Buffer {
    if (this.originalMimeType === this.mimeType && !this.width && this.jpegQuality === 100) {
      return this.buffer;
    }

    let ni: Electron.NativeImage = this.getNativeImage();
    if (this.width && !this.cachedNImage) {
      ni = ni.resize({
        quality: 'best',
        width: this.width,
        height: this.height,
      });
      this.cachedNImage = ni;
    }
    switch (this.mimeType) {
      case 'image/jpeg':
        return ni.toJPEG(this.jpegQuality);
      case 'image/png':
        return ni.toPNG();
    }
  }

  getAspectRatio(): number {
    return this.nImage.getAspectRatio();
  }

  getExtension(): string {
    switch (this.mimeType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
      case 'image/bmp':
      case 'image/tiff':
        return 'png';
    }
  }

  getMimeType(): MimeType {
    return this.mimeType;
  }

  getSize() {
    return this.nImage.getSize();
  }

  getFileSize(): number {
    return (filesize(this.getBuffer().length, { output: 'object', exponent: 2 }) as any).value; // Only output as MB
  }

  hasTransparency(): boolean {
    return this.hasAlpha;
  }

  isEmpty(): boolean {
    return this.buffer.length === 0;
  }

  toJPEG(quality: number = 100): this {
    if (quality) {
      this.jpegQuality = Math.min(100, Math.max(quality, 1));
    }
    this.mimeType = 'image/jpeg';
    return this;
  }

  toPNG(): this {
    this.mimeType = 'image/png';
    return this;
  }

  resize(width: number): this {
    const sizes = this.getSize();
    if (sizes.width <= width) {
      return this;
    }

    this.cachedNImage = null;
    this.width = width;
    this.height = width / this.getAspectRatio();
    return this;
  }

  // Sets buffer, clears cached, clears changed settings
  setBuffer(buffer: Buffer): this {
    this.buffer = buffer;
    this._ni = nativeImage.createFromBuffer(buffer);
    this.cachedNImage = null;
    this.width = null;
    this.height = null;
    this.jpegQuality = 100;
    return this;
  }

  async writeTo(filepath: string, fileName: string): Promise<string> {
    const completePath: string = this.buildFilePath(filepath, fileName);
    await fs.writeFile(completePath, this.getBuffer());
    return completePath;
  }

  buildFilePath(filepath: string, fileName: string): string {
    return path.join(filepath, `${fileName}.${this.getExtension()}`);
  }
}
