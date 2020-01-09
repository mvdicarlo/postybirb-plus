import { app } from 'electron';
import { Injectable } from '@nestjs/common';
import { SubmissionLog, PartWithResponse } from './log.interface';
import { SubmissionLogRepository } from './log.repository';
import { Submission } from '../interfaces/submission.interface';
import { SubmissionType } from '../enums/submission-type.enum';

@Injectable()
export class LogService {
  private readonly MAX_LOGS: number = 30;

  constructor(private readonly repository: SubmissionLogRepository) {}

  async getLogs(type?: SubmissionType): Promise<SubmissionLog[]> {
    let logs = [];
    if (type) {
      logs = (await this.repository.findAll()).filter(log => log.submission.type === type);
    }
    logs = await this.repository.findAll();
    return logs.sort((a, b) => a.created - b.created).reverse();
  }

  async addLog(submission: Submission, parts: PartWithResponse[]): Promise<void> {
    await this.repository.create({
      id: `${submission.id}-${Date.now()}`,
      submission,
      parts,
      version: app.getVersion(),
      created: Date.now(),
    });

    await this.checkForTruncate();
  }

  async checkForTruncate() {
    const logs = await this.getLogs();
    if (logs.length > this.MAX_LOGS) {
      const sorted = logs.sort((a, b) => a.created - b.created).reverse();
      sorted.splice(0, this.MAX_LOGS);
      await Promise.all(sorted.map(log => this.repository.remove(log.id)));
    }
  }
}
