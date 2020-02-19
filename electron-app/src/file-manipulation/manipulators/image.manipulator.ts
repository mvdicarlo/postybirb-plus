import * as Jimp from 'jimp';
import * as fs from 'fs-extra';
import * as shortid from 'shortid';
import * as ChildProcess from 'child_process';
import * as decode from 'image-decode';
import { TEMP_FILE_DIRECTORY } from '../../directories';

type MimeType = 'image/jpeg' | 'image/jpeg' | 'image/png' | 'image/tiff' | 'image/bmp';

export default class ImageManipulator {
  public static readonly DEFERRED_LIMIT: number = 1048576; // 1MB
  public type: MimeType;
  private originalType: MimeType;
  private deferredLocation: string;
  private process: ChildProcess.ChildProcess;
  private img: Jimp;
  private resizeWidth: number;
  private quality: number;
  private convertOnAlpha: boolean;
  private resolve: any;
  private reject: any;
  private alpha: boolean;
  private imageHeight: number;
  private imageWidth: number;
  private propertiesPopulated: boolean;
  private onDestroyFn: (im: this) => void;

  get isDeferred(): boolean {
    return !!this.deferredLocation;
  }

  private constructor(private readonly buffer: Buffer, type: MimeType, deferredObj: string) {
    this.type = type;
    this.originalType = type;
    this.quality = 100;
    this.convertOnAlpha = false;
    this.deferredLocation = deferredObj;
    this.propertiesPopulated = false;
  }

  static async build(data: Buffer, type: MimeType): Promise<ImageManipulator> {
    let deferredObj: string = null;
    if (data.length > ImageManipulator.DEFERRED_LIMIT) {
      deferredObj = `${TEMP_FILE_DIRECTORY}/${shortid.generate()}.tmp`;
      await fs.writeFile(deferredObj, data);
    }

    return new ImageManipulator(data, type, deferredObj);
  }

  static isMimeType(mimeType: string): mimeType is MimeType {
    return (
      mimeType === 'image/png' ||
      mimeType === 'image/jpeg' ||
      mimeType === 'image/tiff' ||
      mimeType === 'image/bmp'
    );
  }

  static getExtension(mimeType: string) {
    switch (mimeType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/bmp':
        return 'bmp';
      case 'image/tiff':
        return 'tiff';
    }
  }

  setConvertOnAlpha(convertOnAlpha: boolean) {
    this.convertOnAlpha = convertOnAlpha;
    return this;
  }

  setQuality(quality: number) {
    this.quality = Math.min(100, Math.max(quality, 1));
    return this;
  }

  setMimeType(type: MimeType) {
    this.type = type;
    return this;
  }

  resize(width: number) {
    this.resizeWidth = Math.floor(Math.max(1, width));
    return this;
  }

  toJPEG(quality?: number) {
    this.setMimeType('image/jpeg');
    if (quality) {
      this.setQuality(quality);
    }
    return this;
  }

  toPNG() {
    return this.setMimeType('image/png');
  }

  async getData(): Promise<{ buffer: Buffer; type: string }> {
    if (!this.hasChanges) {
      return { buffer: this.buffer, type: this.originalType };
    }
    if (this.isDeferred) {
      await this.fork();
      return await this.getBufferFromDeferred();
    } else {
      if (!this.img) {
        this.img = await Jimp.read(this.buffer);
      }
      const clone = this.img.clone();
      clone.quality(this.quality);
      if (this.resizeWidth < clone.bitmap.width) {
        clone.resize(this.resizeWidth, Jimp.AUTO);
      }

      let newType = this.type;
      if (this.convertOnAlpha && !clone.hasAlpha()) {
        newType = Jimp.MIME_JPEG;
      }
      return { buffer: await clone.getBufferAsync(newType), type: newType };
    }
  }

  getDeferredLocation(): string {
    return this.deferredLocation;
  }

  getMimeType(): MimeType {
    return this.type;
  }

  getQuality(): number {
    return this.quality;
  }

  getWidth(): number {
    if (!this.propertiesPopulated) {
      this.fillImageProperties();
    }
    return this.imageWidth;
  }

  getHeight(): number {
    if (!this.propertiesPopulated) {
      this.fillImageProperties();
    }
    return this.imageHeight;
  }

  hasTransparency(): boolean {
    if (this.type === 'image/jpeg') {
      return false;
    }
    if (!this.propertiesPopulated) {
      this.fillImageProperties();
    }
    return this.alpha;
  }

  destroy() {
    if (this.deferredLocation) {
      fs.remove(this.deferredLocation);
    }
    if (this.process) {
      const index = global.CHILD_PROCESS_IDS.indexOf(this.process.pid);
      if (index !== -1) {
        global.CHILD_PROCESS_IDS.splice(index, 1); // clean up processess from list
      }
      process.kill(this.process.pid);
    }
    if (this.onDestroyFn) {
      this.onDestroyFn(this);
    }
  }

  onDestroy(fn: (im: this) => void) {
    this.onDestroyFn = fn;
    return this;
  }

  private hasChanges(): boolean {
    if (this.quality !== 100) {
      return true;
    }

    if (this.type !== this.originalType) {
      return true;
    }

    if (this.resizeWidth) {
      return true;
    }

    if (this.convertOnAlpha && this.originalType !== 'image/jpeg') {
      return true;
    }

    return false;
  }

  // Should be called once ideally and then wait for a return before calling again
  private getBufferFromDeferred(): Promise<{ buffer: Buffer; type: string }> {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this.process.send({
        convertOnAlpha: this.convertOnAlpha,
        location: this.deferredLocation,
        originalType: this.originalType,
        quality: this.quality,
        type: this.type,
        width: this.resizeWidth,
      });
    }).then(async ({ location, type }) => {
      let buffer = this.buffer;
      if (location) {
        buffer = await fs.readFile(location);
        fs.remove(location); // clean up tmp file
      }
      return {
        buffer,
        type: type || this.originalType,
      };
    });
  }

  private fillImageProperties() {
    const { data, width, height } = decode(this.buffer, this.originalType);
    this.alpha = false;
    this.imageHeight = height;
    this.imageWidth = width;
    const rgbaCount = data.length / 4;
    for (let i = 0; i < rgbaCount; i++) {
      const a = data[i * 4 + 3];
      if (!a) {
        this.alpha = true;
        break;
      }
    }
  }

  private async fork(): Promise<void> {
    if (!this.process) {
      this.process = ChildProcess.fork(__dirname + '/image.manipulator.worker');
      global.CHILD_PROCESS_IDS.push(process.pid);
      this.process.on(
        'message',
        (msg: { data: { location: string; type: string }; success: boolean; err?: string }) => {
          if (this.resolve) {
            msg.success ? this.resolve(msg.data) : this.reject(msg);
            this.resolve = null;
            this.reject = null;
          }
        },
      );
      this.process.on('error', err => {
        // tslint:disable-next-line: no-console
        console.log('Worker thread error', err);
        if (this.reject) {
          this.reject(err);
        }
      });
      this.process.on('exit', code => {
        if (this.reject) {
          this.reject(code);
          this.destroy();
        }
      });
    }
  }
}
