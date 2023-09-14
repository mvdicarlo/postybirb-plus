import { IsDefined, IsNotEmpty } from 'class-validator';
import { Settings } from 'postybirb-commons';

export class SettingsUpdateDto {
  @IsNotEmpty()
  key: keyof Settings;

  @IsDefined()
  value: any;
}
