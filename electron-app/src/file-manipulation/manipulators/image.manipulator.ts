import { nativeImage } from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as filesize from 'filesize';
import * as exif from 'piexifjs';
import * as decode from 'image-decode';
import * as encode from 'image-encode';

type MimeType = 'image/jpeg' | 'image/jpeg' | 'image/png' | 'image/tiff' | 'image/bmp';

export default class ImageManipulator {
  private nImage: Electron.NativeImage;
  private mimeType: MimeType;
  private hasAlpha: boolean;

  private constructor(buffer: Buffer, mimeType: MimeType, hasAlpha: boolean) {
    this.mimeType = mimeType;
    this.hasAlpha = hasAlpha;
    if (buffer instanceof Buffer) {
      this.nImage = nativeImage.createFromBuffer(buffer);
    } else {
      throw new Error('Invalid input type');
    }

    switch (mimeType) {
      case 'image/jpeg':
        const exifRemoved = exif.remove(this.getBase64(true));
        this.nImage = nativeImage.createFromBuffer(
          Buffer.from(exifRemoved.replace('data:image/jpeg;base64,', ''), 'base64'),
        );
        break;
    }
  }

  static build(buffer: Buffer, mimeType: MimeType): ImageManipulator {
    let hasAlpha: boolean = false;
    if (mimeType === 'image/png' || mimeType === 'image/tiff' || mimeType === 'image/bmp') {
      const { data, width, height } = decode(buffer, mimeType);
      if (ImageManipulator.hasAlpha(data)) {
        hasAlpha = true;
        if (mimeType !== 'image/png') {
          buffer = Buffer.from(encode(data, { height, width, format: 'image/png' }));
          mimeType = 'image/png';
        }
      } else {
        buffer = Buffer.from(
          encode(data, {
            width,
            height,
            format: 'image/jpeg',
            quality: 100,
          }),
        );
        mimeType = 'image/jpeg';
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
    if (
      mimeType === 'image/png' ||
      mimeType === 'image/jpeg' ||
      mimeType === 'image/tiff' ||
      mimeType === 'image/bmp'
    ) {
      return true;
    }
    return false;
  }

  getNativeImage(): Electron.NativeImage {
    return this.nImage;
  }

  getBase64(withPrepend: boolean): string {
    return `${withPrepend ? `data:${this.mimeType};base64,` : ''}${this.getBuffer().toString(
      'base64',
    )}`;
  }

  getBuffer(): Buffer {
    switch (this.mimeType) {
      case 'image/jpeg':
        return this.nImage.toJPEG(100);
      case 'image/png':
      case 'image/tiff':
        return this.nImage.toPNG();
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
    return this.nImage.isEmpty();
  }

  toJPEG(quality: number = 100): this {
    if ((quality >= 100 || !quality) && this.mimeType === 'image/jpeg') {
      return this;
    }
    this.nImage = nativeImage.createFromBuffer(this.nImage.toJPEG(quality));
    this.mimeType = 'image/jpeg';
    return this;
  }

  toPNG(): this {
    if (this.mimeType === 'image/png') {
      return this;
    }
    this.nImage = nativeImage.createFromBuffer(this.nImage.toPNG());
    this.mimeType = 'image/png';
    return this;
  }

  resize(width: number): this {
    const sizes = this.getSize();
    if (sizes.width <= width) {
      return this;
    }

    this.nImage = this.nImage.resize({
      quality: 'best',
      width,
      height: width / this.getAspectRatio(),
    });
    return this;
  }

  setBuffer(buffer: Buffer | Electron.NativeImage): this {
    if (buffer instanceof Buffer) {
      this.nImage = nativeImage.createFromBuffer(buffer);
    } else {
      this.nImage = buffer;
    }
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
