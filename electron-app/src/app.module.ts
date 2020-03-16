import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { WebsitesModule } from './websites/websites.module';
import { TagGroupModule } from './tag-group/tag-group.module';
import { EventsModule } from './events/events.module';
import { SettingsModule } from './settings/settings.module';
import { DescriptionTemplateModule } from './description-template/description-template.module';
import { UpdateModule } from './update/update.module';
import { SubmissionModule } from './submission/submission.module';
import { AccountModule } from './account/account.module';
import { RemoteModule } from './remote/remote.module';
import { NotificationModule } from './notification/notification.module';
import { FileManipulationModule } from './file-manipulation/file-manipulation.module';
import { CustomShortcutModule } from './custom-shortcut/custom-shortcut.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    WebsitesModule,
    TagGroupModule,
    EventsModule,
    SettingsModule,
    DescriptionTemplateModule,
    UpdateModule,
    SubmissionModule,
    AccountModule,
    RemoteModule,
    NotificationModule,
    FileManipulationModule,
    CustomShortcutModule,
  ],
})
export class AppModule {}
