import { Injectable, Logger } from '@nestjs/common';
import { FileSubmission } from './file-submission.interface';
import { FileRepositoryService } from 'src/file-repository/file-repository.service';
import * as shortid from 'shortid';
import { UploadedFile } from 'src/file-repository/uploaded-file.interface';
import { EventsGateway } from 'src/events/events.gateway';

enum EVENTS {
  SUBMISSION_CREATED = 'FILE SUBMISSION CREATED',
  SUBMISSION_REMOVED = 'FILE SUBMISSION REMOVED',
}

@Injectable()
export class FileSubmissionService {
  private readonly logger = new Logger(FileSubmissionService.name);
  private submissions: FileSubmission[] = [];

  constructor(private readonly fileRepository: FileRepositoryService, private readonly eventEmitter: EventsGateway) {}

  getAllSubmissions(): FileSubmission[] {
    return this.submissions;
  }

  async createSubmission(file: UploadedFile, path: string) {
    const id = shortid.generate();
    const locations = await this.fileRepository.insertFile(id, file, path);
    const submission: FileSubmission = {
      id,
      title: file.originalname,
      fileLocations: {
        originalPath: path,
        submission: locations.submissionLocation,
        thumbnail: locations.thumbnailLocation,
      },
      originalFilename: file.originalname,
      order: this.submissions.length,
      created: Date.now(),
    };
    this.submissions.push(submission);
    this.eventEmitter.emitSubmissionEvent(EVENTS.SUBMISSION_CREATED, submission);
  }

  async removeSubmission(id: string) {
    const submission: FileSubmission = await this.getSubmission(id);
    if (submission) {
      await this.fileRepository.removeSubmissionFiles(submission);
      this.submissions.splice(this.submissions.indexOf(submission), 1);
      this.eventEmitter.emitSubmissionEvent(EVENTS.SUBMISSION_REMOVED, id);
    }
  }

  async getSubmission(id: string): Promise<FileSubmission> {
    return Promise.resolve(this.submissions.find(s => s.id === id));
  }
}
