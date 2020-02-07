import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
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
      convertToJPEG?: boolean;
    },
  ): { buffer: Buffer; mimetype: string } {
    let newBuffer: Buffer = Buffer.from(buffer);
    let newMimeType: string = mimeType;
    if (ImageManipulator.isMimeType(mimeType)) {
      const im: ImageManipulator = ImageManipulator.build(buffer, mimeType, true);
      const originalFileSize = im.getFileSize();
      if (settings.convertToJPEG) {
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
            throw new InternalServerErrorException(
              `Unable to successfully scale image down to ${targetSize}MB from ${originalFileSize}`,
            );
          }
        }
        newMimeType = im.getMimeType();
        newBuffer = im.getBuffer();
      } else {
        newMimeType = im.getMimeType();
        newBuffer = im.getBuffer();
      }
    }

    this.logger.debug(`File scaled from ${buffer.length} -> ${newBuffer.length}`);
    this.logger.debug(`File MIME changed from ${mimeType} -> ${newMimeType}`);
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

    const { width } = im.getSize();
    const sizeSteps = this.getSteps(reductionValue, 10).map(step => (1 - step / 100) * width);

    for (const wdth of sizeSteps) {
      im.resize(wdth);
      if (im.getFileSize() <= targetSize) {
        return true;
      }
    }

    return false;
  }

  private scaleJPEG(im: ImageManipulator, targetSize: number): boolean {
    const maxQualityReduction = this.settings.getValue<number>('maxJPEGQualityCompression');
    const maxSizeReduction = this.settings.getValue<number>('maxJPEGSizeCompression');

    im.toJPEG();

    const { width } = im.getSize();
    const sizeSteps = this.getSteps(maxSizeReduction).map(step => (1 - step / 100) * width);

    for (const wdth of sizeSteps) {
      im.resize(wdth);
      if (im.getFileSize() <= targetSize) {
        return true;
      }
    }

    const qualitySteps = this.getSteps(maxQualityReduction, 2).map(step => (1 - step / 100) * 100);
    // Attempt combo of quality + size (which is probably pretty slow)
    for (const wdth of sizeSteps) {
      for (const quality of qualitySteps) {
        im.toJPEG(quality).resize(wdth);
        if (im.getFileSize() <= targetSize) {
          return true;
        }
      }
    }

    return false;
  }

  private getSteps(value: number, stepSize?: number): number[] {
    if (!value) {
      return [];
    }

    const steps: number[] = [];
    for (let i = stepSize || 5; i < value; i += stepSize || 5) {
      steps.push(i);
    }

    return [...steps, value];
  }
}
