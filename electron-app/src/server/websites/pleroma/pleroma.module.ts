import { Module } from '@nestjs/common';
import { Pleroma } from './pleroma.service';
import { FileManagerModule } from 'src/server/file-manager/file-manager.module';
import { PleromaController } from './pleroma.controller';

@Module({
  controllers: [PleromaController],
  providers: [Pleroma],
  exports: [Pleroma],
  imports: [FileManagerModule],
})
export class PleromaModule {}
