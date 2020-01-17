import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { EventsGateway } from 'src/events/events.gateway';
import PostyBirbNotificationEntity from './models/postybirb-notification.entity';
import { NotificationEvent } from './enums/notification.events.enum';
import { PostyBirbNotification } from './interfaces/postybirb-notification.interface';
import { Notification } from 'electron';

@Injectable()
export class NotificationService {
  constructor(
    private readonly repository: NotificationRepository,
    private readonly eventEmitter: EventsGateway,
  ) {}

  async get(id: string): Promise<PostyBirbNotificationEntity> {
    const notification = this.repository.findOne(id);
    if (!notification) {
      throw new NotFoundException(`Notification ${id} does not exist`);
    }
    return notification;
  }

  getAll(): Promise<PostyBirbNotificationEntity[]> {
    return this.repository.find();
  }

  async createNotification(
    notification: Partial<PostyBirbNotification>,
    icon?: string | Electron.NativeImage,
  ) {
    const entity = new PostyBirbNotificationEntity(notification);
    await this.repository.save(entity);
    this.eventEmitter.emitOnComplete(NotificationEvent.UPDATE, this.getAll());
    this.emitSystemNotification(entity, icon);
  }

  emitSystemNotification(
    notification: PostyBirbNotificationEntity,
    icon?: string | Electron.NativeImage,
  ) {
    if (Notification.isSupported() && !global.SERVER_ONLY_MODE) {
      const { title, body } = notification;
      const systemNotification = new Notification({
        title,
        body,
        icon,
      });

      systemNotification.on('click', () => global.showApp());
      systemNotification.show();
    }
  }

  async markAsViewed(ids: string[]) {
    const notifications = await Promise.all(ids.map(id => this.repository.findOne(id)));
    await Promise.all(
      notifications
        .filter(notification => notification)
        .map(notification => {
          notification.viewed = true;
          return this.repository.update(notification);
        }),
    );

    this.eventEmitter.emitOnComplete(NotificationEvent.UPDATE, this.getAll());
  }

  async deleteNotification(id: string) {
    await this.repository.remove(id);
    this.eventEmitter.emitOnComplete(NotificationEvent.UPDATE, this.getAll());
  }

  async deleteAll() {
    await this.repository.removeAll();
    this.eventEmitter.emit(NotificationEvent.UPDATE, []);
  }
}
