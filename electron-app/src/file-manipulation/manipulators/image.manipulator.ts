import { nativeImage } from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as filesize from 'filesize';
import * as exif from 'piexifjs';
import { Image } from 'image-js';
import * as bmp from 'bmp-js';

type MimeType = 'image/jpg' | 'image/png' | 'image/tiff' | 'image/bmp';

// TODO test with tiff
export default class ImageManipulator {
  private nImage: Electron.NativeImage;
  private mimeType: MimeType;

  private constructor(buffer: Buffer, mimeType: MimeType) {
    this.mimeType = mimeType;
    if (buffer instanceof Buffer) {
      this.nImage = nativeImage.createFromBuffer(buffer);
    } else {
      throw new Error('Invalid input type');
    }

    switch (mimeType) {
      case 'image/jpg':
        const exifRemoved = exif.remove(this.getBase64(true));
        this.nImage = nativeImage.createFromBuffer(
          Buffer.from(exifRemoved.replace('data:image/jpg;base64,', ''), 'base64'),
        );
        break;
      case 'image/bmp':
        const { data, width, height, is_width_alpha } = bmp.decode(buffer);
        this.nImage = nativeImage.createFromBitmap(data, { width, height });
        if (is_width_alpha) {
          this.toPNG();
        } else {
          this.toJPEG();
        }
        break;
    }
  }

  static async build(data: Buffer, mimeType: MimeType): Promise<ImageManipulator> {
    const instance = new ImageManipulator(data, mimeType);
    switch (instance.getMimeType()) {
      case 'image/png':
        const image: Image = await Image.load(instance.getBuffer());
        if (!image.alpha) {
          instance.toJPEG(100);
        }
        break;
    }

    return instance;
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
      case 'image/jpg':
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
      case 'image/jpg':
        return 'jpg';
      case 'image/png':
      case 'image/tiff':
        return 'png';
    }
  }

  getMimeType(): MimeType {
    return this.mimeType;
  }

  getSize(): { width: number; height: number } {
    return this.nImage.getSize();
  }

  getFileSize(): number {
    return (filesize(this.getBuffer().length, { output: 'object', exponent: 2 }) as any).value; // Only output as MB
  }

  isEmpty(): boolean {
    return this.nImage.isEmpty();
  }

  toJPEG(quality: number = 100): this {
    if (quality === 100 && this.mimeType === 'image/jpg') {
      return this;
    }
    this.nImage = nativeImage.createFromBuffer(this.nImage.toJPEG(quality));
    this.mimeType = 'image/jpg';
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

  async writeTo(filepath: string, fileName: string): Promise<string> {
    const completePath: string = path.join(filepath, `${fileName}.${this.getExtension()}`);
    await fs.writeFile(completePath, this.getBuffer());
    return completePath;
  }
}
