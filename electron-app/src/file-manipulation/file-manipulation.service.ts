import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { SettingsService } from 'src/settings/settings.service';
import ImageManipulator from './manipulators/image.manipulator';

// TODO test

@Injectable()
export class FileManipulationService {
  private readonly logger = new Logger(FileManipulationService.name);

  constructor(private readonly settings: SettingsService) {}

  async scale(
    buffer: Buffer,
    mimeType: string,
    targetSize: number, // Assumed to be in bytes
    settings: {
      convertToJPEG?: boolean;
    },
  ): Promise<{ buffer: Buffer; mimetype: string }> {
    let newBuffer: Buffer = buffer;
    let newMimeType: string = mimeType;

    if (ImageManipulator.isMimeType(mimeType)) {
      const originalFileSize = buffer.length;
      if (originalFileSize > targetSize) {
        const im: ImageManipulator = await ImageManipulator.build(buffer, mimeType);
        if (settings.convertToJPEG) {
          im.toJPEG();
        }

        const pngScaledBuffer = await this.scalePNG(im, originalFileSize, targetSize);
        if (!pngScaledBuffer) {
          const jpgScaledBuffer = await this.scaleJPEG(im, originalFileSize, targetSize);
          if (!jpgScaledBuffer) {
            im.destroy();
            this.logger.warn(
              `Unable to successfully scale image down to ${targetSize} bytes from ${originalFileSize} bytes`,
            );
            throw new InternalServerErrorException(
              `Unable to successfully scale image down to ${targetSize} bytes from ${originalFileSize} bytes`,
            );
          } else {
            im.destroy();
            newMimeType = 'image/jpeg';
            newBuffer = jpgScaledBuffer;
          }
        } else {
          im.destroy();
          newMimeType = 'image/png';
          newBuffer = pngScaledBuffer;
        }
      }
    }

    this.logger.debug(
      `File scaled from ${buffer.length / 1048576}MB -> ${newBuffer.length / 1048576}MB`,
    );
    this.logger.debug(`File MIME changed from ${mimeType} -> ${newMimeType}`);
    return { buffer: newBuffer, mimetype: newMimeType };
  }

  canScale(mimeType: string): boolean {
    return ImageManipulator.isMimeType(mimeType);
  }

  private async scalePNG(
    im: ImageManipulator,
    originalSize: number,
    targetSize: number,
  ): Promise<Buffer | null> {
    if (im.getMimeType() === 'image/jpeg') {
      return null;
    }

    im.toPNG();

    let reductionValue: number = this.settings.getValue<number>('maxPNGSizeCompression');
    if (im.hasTransparency()) {
      reductionValue = this.settings.getValue<number>('maxPNGSizeCompressionWithAlpha');
    }

    const width = im.getWidth();
    const stepSize =
      originalSize / targetSize > 1.5 ? Math.max(Math.floor(reductionValue / 2), 10) : 10; // try to optimize # of runs for way larger files
    const sizeSteps = this.getSteps(reductionValue, stepSize).map(step => (1 - step / 100) * width);

    const lastStep = sizeSteps.pop();
    im.resize(lastStep);
    const lastScaled = await im.getData(); // check end first to see if its bother calculating anything between
    if (lastScaled.buffer.length > targetSize) {
      return null;
    }

    for (const wdth of sizeSteps) {
      im.resize(wdth);
      const scaled = await im.getData();
      if (scaled.buffer.length <= targetSize) {
        return scaled.buffer;
      }
    }

    return lastScaled.buffer;
  }

  private async scaleJPEG(
    im: ImageManipulator,
    originalSize: number,
    targetSize: number,
  ): Promise<Buffer> {
    const maxQualityReduction = this.settings.getValue<number>('maxJPEGQualityCompression');
    const maxSizeReduction = this.settings.getValue<number>('maxJPEGSizeCompression');

    im.toJPEG();

    const width = im.getWidth();
    const stepSize =
      originalSize / targetSize > 2 ? Math.max(Math.floor(maxQualityReduction / 4), 10) : 10; // try to optimize # of runs for way larger files
    const sizeSteps = this.getSteps(maxSizeReduction, stepSize).map(
      step => (1 - step / 100) * width,
    );

    const lastStep = sizeSteps[sizeSteps.length - 1];
    im.resize(lastStep);
    const lastScaled = await im.getData(); // check end first to see if its bother calculating anything between
    if (lastScaled.buffer.length <= targetSize) {
      if (lastScaled.buffer.length === targetSize) {
        return lastScaled.buffer;
      }
      for (const wdth of sizeSteps.slice(0, -1)) {
        im.resize(wdth);
        const scaled = await im.getData();

        if (scaled.buffer.length <= targetSize) {
          return scaled.buffer;
        }
      }
      return lastScaled.buffer;
    }

    const qualitySteps = this.getSteps(maxQualityReduction, 2).map(step => (1 - step / 100) * 100);
    // Attempt combo of quality + size (which is probably pretty slow)
    for (const wdth of sizeSteps) {
      for (const quality of qualitySteps) {
        im.toJPEG(quality).resize(wdth);
        const scaled = await im.getData();
        if (scaled.buffer.length <= targetSize) {
          return scaled.buffer;
        }
      }
    }

    return null;
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
