import { IsNotEmpty } from 'class-validator';
import { Settings } from './settings.interface';

export class SettingsUpdateDto {
  @IsNotEmpty()
  key: keyof Settings;

  @IsNotEmpty()
  value: any;
}
