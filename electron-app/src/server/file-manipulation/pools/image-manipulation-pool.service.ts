import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';
import ImageManipulator from '../manipulators/image.manipulator';
import { UiNotificationService } from 'src/server/notification/ui-notification/ui-notification.service';
import { NotificationType } from 'src/server/notification/enums/notification-type.enum';

interface QueuedWaiter {
  resolve: (im: ImageManipulator) => void;
  arguments: {
    data: Buffer;
    type: string;
  };
}

@Injectable()
export class ImageManipulationPoolService {
  private readonly logger: Logger = new Logger(ImageManipulationPoolService.name);

  private queue: QueuedWaiter[] = [];
  private inUse: ImageManipulator[] = [];
  private readonly MAX_COUNT: number = Math.min(os.cpus().length, 4);
  private hasAlerted: boolean = false;

  constructor(private readonly uiNotificationService: UiNotificationService) {}

  getImageManipulator(data: Buffer, type: string): Promise<ImageManipulator> {
    return new Promise(async resolve => {
      if (data.length > ImageManipulator.DEFERRED_LIMIT) {
        if (this.inUse.length < this.MAX_COUNT) {
          const im = await ImageManipulator.build(data, type as any);
          this.inUse.push(im);
          resolve(im.onDestroy(this.onDestroyCallback.bind(this)));
          this.logger.debug(`Pool Size = ${this.inUse.length} of ${this.MAX_COUNT}`);
        } else {
          this.logger.debug('Queueing Image Manipulator');
          this.queue.push({
            resolve,
            arguments: {
              data,
              type,
            },
          });

          if (!this.hasAlerted) {
            this.hasAlerted = true;
            this.uiNotificationService.createUINotification(
              NotificationType.INFO,
              0,
              'PostyFox is currently processing many image files. This may affect the time it takes to create or post image based submissions.',
            );
          }
        }
      } else {
        resolve(await ImageManipulator.build(data, type as any));
      }
    });
  }

  private onDestroyCallback(im: ImageManipulator) {
    this.logger.debug('Destroying Image Manipulator');
    const index = this.inUse.indexOf(im);
    if (index !== -1) {
      this.inUse.splice(index, 1);
    }
    this.resolveNext();
  }

  private async resolveNext() {
    if (this.queue.length) {
      this.logger.debug('Resolving next Image Manipulator');
      const next = this.queue.shift();
      const im = await ImageManipulator.build(next.arguments.data, next.arguments.type as any);
      im.onDestroy(this.onDestroyCallback.bind(this));
      this.inUse.push(im);
      next.resolve(im);
    }
  }
}
