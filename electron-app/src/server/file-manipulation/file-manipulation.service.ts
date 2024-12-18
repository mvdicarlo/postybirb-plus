import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { SettingsService } from 'src/server/settings/settings.service';
import ImageManipulator from './manipulators/image.manipulator';
import { ImageManipulationPoolService } from './pools/image-manipulation-pool.service';
import { ScalingOptions } from 'src/server/websites/interfaces/scaling-options.interface';

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
    scalingOptions: ScalingOptions,
    settings: {
      convertToJPEG?: boolean;
    },
  ): Promise<{ buffer: Buffer; mimetype: string }> {
    let targetSize = scalingOptions.maxSize; // Assumed to be bytes
    let newBuffer: Buffer = buffer;
    let newMimeType: string = mimeType;

    if (ImageManipulator.isMimeType(mimeType)) {
      const im: ImageManipulator = await this.imageManipulationPool.getImageManipulator(
        buffer,
        mimeType,
      );
      this.logger.debug('Acquired Image Manipulator');

      try {
        let skipRescale = false;
        let prescale = 1.0;
        // Is the file above the pixel dimension limits, if set ?
        if (scalingOptions.maxHeight || scalingOptions.maxWidth) {
          let maxSize = 0;
          if (scalingOptions.maxWidth) {
            maxSize = scalingOptions.maxWidth;
          }
          if (scalingOptions.maxHeight && scalingOptions.maxHeight < maxSize) {
            maxSize = scalingOptions.maxHeight;
          }

          if (maxSize < im.getHeight() || maxSize < im.getWidth()) {
            const scaled = await im.resize(maxSize).getData();
            prescale = Math.min(maxSize / im.getWidth(), maxSize / im.getHeight());
            newBuffer = scaled.buffer;

            if (newBuffer.length > targetSize) {
              this.logger.debug(
                `newBuffer still in excess of the target size; will need to rescale by size not px`,
              );
            } else {
              skipRescale = true;
            }
          }
        }

        // THEN check for file size limit as before
        if (!skipRescale) {
          const originalFileSize = buffer.length;
          if (originalFileSize > targetSize) {
            if (settings.convertToJPEG) {
              im.toJPEG();
            }

            const pngScaledBuffer = await this.scalePNG(
              im,
              originalFileSize,
              targetSize,
              prescale,
            );
            if (!pngScaledBuffer) {
              const jpgScaledBuffer = await this.scaleJPEG(
                im,
                originalFileSize,
                targetSize,
                prescale,
              );
              if (!jpgScaledBuffer) {
                this.logger.warn(
                  `Unable to successfully scale image down to ${targetSize} bytes from ${originalFileSize} bytes`,
                );
                throw new InternalServerErrorException(
                  `Unable to successfully scale image down to ${targetSize} bytes from ${originalFileSize} bytes`,
                );
              } else {
                newMimeType = 'image/jpeg';
                newBuffer = jpgScaledBuffer;
              }
            } else {
              newMimeType = 'image/png';
              newBuffer = pngScaledBuffer;
            }
          }
        }
      } finally {
        im.destroy();
        this.logger.debug('Released Image Manipulator');
      }
    }

    if (buffer.length !== newBuffer.length) {
      this.logger.log(
        `File scaled from ${(buffer.length / 1048576).toFixed(2)}MB -> ${(
          newBuffer.length / 1048576
        ).toFixed(2)}MB`,
      );
    }

    if (mimeType !== newMimeType) {
      this.logger.debug(`File MIME changed from ${mimeType} -> ${newMimeType}`);
    }

    return { buffer: newBuffer, mimetype: newMimeType };
  }

  canScale(mimeType: string): boolean {
    return ImageManipulator.isMimeType(mimeType);
  }

  private async scalePNG(
    im: ImageManipulator,
    originalSize: number,
    targetSize: number,
    prescale: number,
  ): Promise<Buffer | null> {
    if (im.getMimeType() === 'image/jpeg') {
      return null;
    }

    im.toPNG();

    let reductionValue: number = this.settings.getValue<number>('maxPNGSizeCompression');
    if (im.hasTransparency()) {
      reductionValue = this.settings.getValue<number>('maxPNGSizeCompressionWithAlpha');
    } else if (!this.settings.getValue('reduceSizeOverQuality')) {
      return null;
    }

    const scaleSize = originalSize / targetSize > 1.5 ? 20 : 10; // try to optimize # of runs for way larger files
    const scaleSteps = this.getSteps(this.applyPrescale(reductionValue, prescale), scaleSize).map(
      step => 1 - step / 100,
    );

    const lastStep = scaleSteps.pop();
    const lastScaled = await im.scale(lastStep).getData(); // check end first to see if we should calculate anything between
    if (lastScaled.buffer.length > targetSize) {
      return null;
    }

    for (const scale of scaleSteps) {
      const scaled = await im.scale(scale).getData();
      if (scaled.buffer.length <= targetSize) {
        this.logger.log(`File Compressed successfully at ${scale} scale`, 'PNG COMPRESSION');
        return scaled.buffer;
      }
    }

    this.logger.log(`File Compressed successfully at ${lastStep} scale`, 'PNG COMPRESSION');
    return lastScaled.buffer;
  }

  private async scaleJPEG(
    im: ImageManipulator,
    originalSize: number,
    targetSize: number,
    prescale: number,
  ): Promise<Buffer> {
    const maxQualityReduction = this.settings.getValue<number>('maxJPEGQualityCompression');
    const maxSizeReduction = this.settings.getValue<number>('maxJPEGSizeCompression');

    im.toJPEG();

    if (!this.settings.getValue('reduceSizeOverQuality')) {
      const minQuality = Math.max(1, Math.round(100 - maxQualityReduction));
      // Quality reduction on its own is pretty fast, so just try every value
      // along the way instead of using some kind of smart scale stepping.
      for (let quality = 100; quality >= minQuality; --quality) {
        const compressed = await im.setQuality(quality).getData();
        if (compressed.buffer.length <= targetSize) {
          this.logger.log(
            `File Compressed successfully at ${quality}% quality`,
            'JPEG QUALITY COMPRESSION',
          );
          return compressed.buffer;
        }
      }
    }

    im.setQuality(100);

    const scaleSize = originalSize / targetSize > 2 ? 20 : 10; // try to optimize # of runs for way larger files
    const scaleSteps = this.getSteps(this.applyPrescale(maxSizeReduction, prescale), scaleSize).map(
      step => 1 - step / 100,
    );

    const lastStep = scaleSteps[scaleSteps.length - 1];
    const lastScaled = await im.scale(lastStep).getData(); // check end first to see if we should calculate anything between
    if (lastScaled.buffer.length <= targetSize) {
      if (lastScaled.buffer.length === targetSize) {
        this.logger.log(
          `File Compressed successfully at ${lastStep} scale`,
          'JPEG SCALE COMPRESSION',
        );
        return lastScaled.buffer;
      }
      for (const scale of scaleSteps.slice(0, -1)) {
        const scaled = await im.scale(scale).getData();
        if (scaled.buffer.length <= targetSize) {
          this.logger.log(
            `File Compressed successfully at ${scale} scale`,
            'JPEG SCALE COMPRESSION',
          );
          return scaled.buffer;
        }
      }

      this.logger.log(
        `File Compressed successfully at ${lastStep} scale`,
        'JPEG SCALE COMPRESSION',
      );
      return lastScaled.buffer;
    }

    const qualitySteps = [
      99,
      ...this.getSteps(maxQualityReduction, 2).map(step => (1 - step / 100) * 100),
    ];
    // Attempt combo of quality + size (which is probably pretty slow)
    for (const scale of scaleSteps) {
      for (const quality of qualitySteps) {
        im.toJPEG(quality).scale(scale);
        const scaled = await im.getData();
        if (scaled.buffer.length <= targetSize) {
          this.logger.log(
            `File Compressed successfully at ${quality}% quality and ${scale} scale`,
            'JPEG SCALE AND QUALITY COMPRESSION',
          );
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

  // The user specifies a maximum size reduction in the application settings,
  // but website limits may have caused the image to already have been scaled
  // down. In that case, we need to rescale the reduction amount.
  private applyPrescale(reductionValue: number, prescale: number): number {
    if (prescale < 1.0) {
      return Math.max(
        0.0,
        Math.floor(100.0 - ((100.0 - reductionValue) / 100.0 / prescale) * 100.0),
      );
    } else {
      return reductionValue;
    }
  }
}
