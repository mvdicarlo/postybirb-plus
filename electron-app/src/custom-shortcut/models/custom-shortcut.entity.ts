import Entity from 'src/database/models/entity.model';
import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';
import { CustomShortcut } from '../interfaces/custom-shortcut.interface';

export default class CustomShortcutEntity extends Entity implements CustomShortcut {
  @IsString()
  @IsNotEmpty()
  shortcut: string;

  @IsString()
  content: string;

  @IsBoolean()
  @IsNotEmpty()
  isStatic: boolean;

  constructor(partial?: Partial<CustomShortcutEntity>) {
    super(partial);
  }
}
