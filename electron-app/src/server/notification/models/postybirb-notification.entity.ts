import Entity from 'src/server/database/models/entity.model';
import { PostyBirbNotification, NotificationType as PBNotificationType } from 'postybirb-commons';
import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { NotificationType } from '../enums/notification-type.enum';

export default class PostyBirbNotificationEntity extends Entity implements PostyBirbNotification {
  @IsEnum(NotificationType)
  type: NotificationType | PBNotificationType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsBoolean()
  @IsOptional()
  viewed: boolean;

  constructor(partial?: Partial<PostyBirbNotificationEntity>) {
    super(partial);
  }
}
