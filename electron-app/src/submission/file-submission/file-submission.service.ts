import { Injectable, Logger } from '@nestjs/common';
import { FileSubmission } from './file-submission.interface';
import { FileRepositoryService } from 'src/file-repository/file-repository.service';
import * as shortid from 'shortid';
import { UploadedFile } from 'src/file-repository/uploaded-file.interface';
import { EventsGateway } from 'src/events/events.gateway';
import { FileSubmissionRepository } from './file-submission.repository';

enum EVENTS {
  SUBMISSION_CREATED = 'FILE SUBMISSION CREATED',
  SUBMISSION_REMOVED = 'FILE SUBMISSION REMOVED',
}

@Injectable()
export class FileSubmissionService {
  private readonly logger = new Logger(FileSubmissionService.name);

  constructor(
    private readonly repository: FileSubmissionRepository,
    private readonly fileRepository: FileRepositoryService,
    private readonly eventEmitter: EventsGateway,
  ) {}

  async createSubmission(file: UploadedFile, path: string): Promise<void> {
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
      order: await this.repository.count(),
      created: Date.now(),
    };

    await this.repository.create(submission);
    this.eventEmitter.emitSubmissionEvent(
      EVENTS.SUBMISSION_CREATED,
      submission,
    );
  }

  async removeSubmission(id: string): Promise<void> {
    await this.repository.remove(id);
    this.eventEmitter.emitSubmissionEvent(EVENTS.SUBMISSION_REMOVED, id);
  }

  async find(id: string): Promise<FileSubmission> {
    return this.repository.find(id);
  }

  getAll(): Promise<FileSubmission[]> {
    return this.repository.findAll();
  }
}
