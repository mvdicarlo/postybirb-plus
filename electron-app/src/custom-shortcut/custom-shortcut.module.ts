import { Module } from '@nestjs/common';
import { CustomShortcutController } from './custom-shortcut.controller';
import { CustomShortcutService } from './custom-shortcut.service';
import { CustomShortcutRepositoryToken } from './custom-shortcut.repository';
import CustomShortcutEntity from './models/custom-shortcut.entity';
import { DatabaseFactory } from 'src/database/database.factory';

@Module({
  controllers: [CustomShortcutController],
  providers: [
    CustomShortcutService,
    DatabaseFactory.forProvider(CustomShortcutRepositoryToken, {
      entity: CustomShortcutEntity,
      databaseName: 'custom-shortcut',
    }),
  ],
  exports: [CustomShortcutService],
})
export class CustomShortcutModule {}
