import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { SettingsService } from 'src/settings/settings.service';
import ImageManipulator from './manipulators/image.manipulator';
import { ImageManipulationPoolService } from './pools/image-manipulation-pool.service';

// TODO test

@Injectable()
export class FileManipulationService {
  private readonly logger = new Logger(FileManipulationService.name);

  constructor(
    private readonly settings: SettingsService,
    private readonly imageManipulationPool: ImageManipulationPoolService,
  ) {}

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
        const im: ImageManipulator = await this.imageManipulationPool.getImageManipulator(
          buffer,
          mimeType,
        );
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

    const scaleSize = originalSize / targetSize > 1.5 ? 20 : 10; // try to optimize # of runs for way larger files
    const scaleSteps = this.getSteps(reductionValue, scaleSize).map(step => 1 - step / 100);

    const lastStep = scaleSteps.pop();
    const lastScaled = await im.scale(lastStep).getData(); // check end first to see if we should calculate anything between
    if (lastScaled.buffer.length > targetSize) {
      return null;
    }

    for (const scale of scaleSteps) {
      const scaled = await im.scale(scale).getData();
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

    im.toJPEG().setQuality(100);

    const scaleSize = originalSize / targetSize > 2 ? 20 : 10; // try to optimize # of runs for way larger files
    const scaleSteps = this.getSteps(maxSizeReduction, scaleSize).map(step => 1 - step / 100);

    const lastStep = scaleSteps[scaleSteps.length - 1];
    const lastScaled = await im.scale(lastStep).getData(); // check end first to see if we should calculate anything between
    if (lastScaled.buffer.length <= targetSize) {
      if (lastScaled.buffer.length === targetSize) {
        return lastScaled.buffer;
      }
      for (const scale of scaleSteps.slice(0, -1)) {
        const scaled = await im.scale(scale).getData();
        if (scaled.buffer.length <= targetSize) {
          return scaled.buffer;
        }
      }
      return lastScaled.buffer;
    }

    const qualitySteps = [99, ...this.getSteps(maxQualityReduction, 2).map(step => (1 - step / 100) * 100)];
    // Attempt combo of quality + size (which is probably pretty slow)
    for (const scale of scaleSteps) {
      for (const quality of qualitySteps) {
        im.toJPEG(quality).scale(scale);
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
