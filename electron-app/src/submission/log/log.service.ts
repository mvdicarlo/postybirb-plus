import { app } from 'electron';
import { Injectable, Logger } from '@nestjs/common';
import { SubmissionLog, PartWithResponse } from './interfaces/submission-log.interface';
import { SubmissionLogRepository } from './log.repository';
import { Submission } from '../interfaces/submission.interface';
import { SubmissionType } from '../enums/submission-type.enum';
import SubmissionLogEntity from './models/submission-log.entity';
import SubmissionEntity from '../models/submission.entity';

@Injectable()
export class LogService {
  private readonly logger = new Logger(LogService.name);
  private readonly MAX_LOGS: number = 30;

  constructor(private readonly repository: SubmissionLogRepository) {}

  async getLogs(type?: SubmissionType): Promise<SubmissionLogEntity[]> {
    let logs = await this.repository.find();
    if (type) {
      logs = logs.filter(log => log.submission.type === type);
    }
    return logs.sort((a, b) => a.created - b.created).reverse();
  }

  async addLog(submission: SubmissionEntity, parts: PartWithResponse[]): Promise<void> {
    this.logger.log(submission._id, 'Creating Log');
    await this.repository.save(
      new SubmissionLogEntity({
        submission,
        parts,
        version: app.getVersion(),
      }),
    );

    await this.checkForTruncate();
  }

  async checkForTruncate() {
    const logs = await this.getLogs();
    if (logs.length > this.MAX_LOGS) {
      const sorted = logs.sort((a, b) => a.created - b.created).reverse();
      sorted.splice(0, this.MAX_LOGS);
      await Promise.all(sorted.map(log => this.repository.remove(log._id)));
    }
  }
}
