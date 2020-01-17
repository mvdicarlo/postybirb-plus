import Entity from 'src/base/entity/entity.base';
import { PostyBirbNotification } from '../interfaces/postybirb-notification.interface';
import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { NotificationType } from '../enums/notification-type.enum';

export default class PostyBirbNotificationEntity extends Entity implements PostyBirbNotification {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsBoolean()
  @IsOptional()
  viewed: boolean;
}
