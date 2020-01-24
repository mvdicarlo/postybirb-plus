import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from 'src/settings/settings.service';
import ImageManipulator from './manipulators/image.manipulator';

// TODO test

@Injectable()
export class FileManipulationService {
  private readonly logger = new Logger(FileManipulationService.name);

  constructor(private readonly settings: SettingsService) {}

  scale(
    buffer: Buffer,
    mimeType: string,
    targetSize: number,
    settings: {
      autoConvertToJPEG: boolean;
    },
  ): { buffer: Buffer; mimetype: string } {
    let newBuffer: Buffer = Buffer.from(buffer);
    let newMimeType: string = mimeType;
    if (ImageManipulator.isMimeType(mimeType)) {
      const im: ImageManipulator = ImageManipulator.build(buffer, mimeType);
      const originalFileSize = im.getFileSize();
      if (settings.autoConvertToJPEG) {
        im.toJPEG();
      }

      if (im.getFileSize() > targetSize) {
        let jpgScaleSuccess = false;
        const pngScaleSuccess = this.scalePNG(im, targetSize);

        if (!pngScaleSuccess) {
          jpgScaleSuccess = this.scaleJPEG(im, targetSize);
          if (!jpgScaleSuccess) {
            this.logger.warn(
              `Unable to successfully scale image down to ${targetSize}MB from ${originalFileSize}`,
            );
          }
        }
      } else {
        newMimeType = im.getMimeType();
        newBuffer = im.getBuffer();
      }
    }

    return { buffer: newBuffer, mimetype: newMimeType };
  }

  canScale(mimeType: string): boolean {
    return ImageManipulator.isMimeType(mimeType);
  }

  private scalePNG(im: ImageManipulator, targetSize: number): boolean {
    if (im.getMimeType() !== 'image/png') {
      return false;
    }

    let reductionValue: number = this.settings.getValue<number>('maxPNGSizeCompression');
    if (im.hasTransparency()) {
      reductionValue = this.settings.getValue<number>('maxPNGSizeCompressionWithAlpha');
    }

    const originalBuffer: Buffer = im.getBuffer();
    const { width } = im.getSize();
    const sizeSteps = this.getSteps(reductionValue).map(step => (1 - step / 100) * width);

    for (const wdth of sizeSteps) {
      im.resize(wdth);
      if (im.getFileSize() <= targetSize) {
        return true;
      }
    }

    im.setBuffer(originalBuffer); // revert resizes
    return false;
  }

  private scaleJPEG(im: ImageManipulator, targetSize: number): boolean {
    const maxQualityReduction = this.settings.getValue<number>('maxJPEGQualityCompression');
    const maxSizeReduction = this.settings.getValue<number>('maxJPEGSizeCompression');

    im.toJPEG();

    const originalBuffer: Buffer = im.getBuffer();
    const { width } = im.getSize();
    const sizeSteps = this.getSteps(maxSizeReduction).map(step => (1 - step / 100) * width);

    for (const wdth of sizeSteps) {
      im.resize(wdth);
      if (im.getFileSize() <= targetSize) {
        return true;
      }
    }

    im.setBuffer(originalBuffer);
    const qualitySteps = this.getSteps(maxQualityReduction).map(step => (1 - step / 100) * width);
    for (const quality of qualitySteps) {
      im.toJPEG(quality);
      if (im.getFileSize() <= targetSize) {
        return true;
      }

      im.setBuffer(originalBuffer);
    }

    // Attempt combo of quality + size (which is probably pretty slow)
    im.setBuffer(originalBuffer);
    for (const wdth of sizeSteps) {
      im.resize(wdth);
      const resizedBuffer = im.getBuffer();

      for (const quality of qualitySteps) {
        im.toJPEG(quality);
        if (im.getFileSize() <= targetSize) {
          return true;
        }

        im.setBuffer(resizedBuffer);
      }
    }

    im.setBuffer(originalBuffer); // revert resizes
    return false;
  }

  private getSteps(value: number): number[] {
    if (!value) {
      return [];
    }

    const steps: number[] = [];
    for (let i = 5; i < value; i += 5) {
      steps.push(i);
    }

    return [...steps, value];
  }
}
