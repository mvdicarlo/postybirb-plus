import * as Jimp from 'jimp';
import * as fs from 'fs-extra';
import * as shortid from 'shortid';
import * as ChildProcess from 'child_process';
import { TEMP_FILE_DIRECTORY } from '../../directories';

type MimeType = 'image/jpeg' | 'image/jpeg' | 'image/png' | 'image/tiff' | 'image/bmp';
interface ModifyOptions {
  width?: number;
  quality?: number;
  type?: MimeType;
}

export default class ImageManipulator {
  private static readonly DEFERRED_LIMIT: number = 4194304; // 4MB
  public type: MimeType;
  private originalType: MimeType;
  private deferredLocation: string;
  private process: ChildProcess.ChildProcess;
  private img: Jimp;
  private width: number;
  private quality: number;
  private resolve: any;
  private reject: any;

  get isDeferred(): boolean {
    return !!this.deferredLocation;
  }

  private constructor(private readonly buffer: Buffer, type: MimeType, deferredObj: string | Jimp) {
    this.type = type;
    this.originalType = type;
    this.quality = 100;
    if (typeof deferredObj === 'string') {
      this.deferredLocation = deferredObj;
    } else {
      this.img = deferredObj;
    }
  }

  static async build(data: Buffer | string, type: MimeType): Promise<ImageManipulator> {
    let buffer: Buffer;
    if (data instanceof Buffer) {
      buffer = data;
    } else if (typeof data === 'string') {
      buffer = await fs.readFile(data);
    }

    let deferredObj: string | Jimp = null;
    if (buffer.length > ImageManipulator.DEFERRED_LIMIT) {
      deferredObj = `${TEMP_FILE_DIRECTORY}/${shortid.generate()}.tmp`;
      await fs.writeFile(deferredObj, buffer);
    } else {
      deferredObj = await Jimp.read(buffer);
      type = deferredObj.hasAlpha() ? Jimp.MIME_PNG : Jimp.MIME_JPEG;
    }

    return new ImageManipulator(buffer, type, deferredObj);
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
      case 'image/bmp':
      case 'image/tiff':
        return 'png';
    }
  }

  setType(type: MimeType) {
    this.type = type;
    return this;
  }

  setWidth(width: number) {
    this.width = Math.max(1, width);
    return this;
  }

  setQuality(quality: number) {
    this.quality = Math.min(100, Math.max(quality, 1));
    return this;
  }

  async getData(): Promise<{ buffer: Buffer; type: string }> {
    if (this.isDeferred) {
      await this.fork();
      return await this.getBufferFromDeferred();
    } else {
      const clone = this.img.clone();
      clone.quality(this.quality);
      if (this.width < clone.bitmap.width) {
        clone.resize(this.width, Jimp.AUTO);
      }
      return { buffer: await clone.getBufferAsync(this.type), type: this.type };
    }
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
  }

  // Should be called once ideally and then wait for a return before calling again
  private getBufferFromDeferred(): Promise<{ buffer: Buffer; type: string }> {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this.process.send({
        location: this.deferredLocation,
        width: this.width,
        quality: this.quality,
        type: this.type,
        originalType: this.originalType,
      });
    }).then((msg: { buffer: string; type: MimeType }) => {
      return { buffer: Buffer.from(msg.buffer, 'base64'), type: msg.type };
    });
  }

  private async fork(): Promise<void> {
    if (!this.process) {
      this.process = ChildProcess.fork(__dirname + '/image.manipulator.worker');
      global.CHILD_PROCESS_IDS.push(process.pid);
      this.process.on('message', msg => {
        if (this.resolve) {
          msg.code === 'ERROR' ? this.reject(msg) : this.resolve(msg.data);
        }
      });
    }
  }
}
