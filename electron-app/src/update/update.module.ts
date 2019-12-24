import { Module } from '@nestjs/common';
import { UpdateController } from './update.controller';
import { UpdateService } from './update.service';
import { SubmissionModule } from 'src/submission/submission.module';

@Module({
  imports: [SubmissionModule],
  controllers: [UpdateController],
  providers: [UpdateService],
})
export class UpdateModule {}
