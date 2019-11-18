import { Injectable, Logger } from '@nestjs/common';
import { FileSubmission } from './file-submission.interface';
import { FileRepositoryService } from 'src/file-repository/file-repository.service';
import * as shortid from 'shortid';
import { UploadedFile } from 'src/file-repository/uploaded-file.interface';
import { EventsGateway } from 'src/events/events.gateway';
import { FileSubmissionRepository } from './file-submission.repository';
import { getSubmissionType, FileSubmissionType } from './enums/file-submission-type.enum';
import { SubmissionType, Submission } from 'src/submission/submission.interface';
import { SubmissionPartService } from '../submission-part/submission-part.service';
import { ValidatorService } from '../validator/validator.service';
import { SubmissionPart } from '../interfaces/submission-part.interface';
import { SubmissionPackage } from '../interfaces/submission-package.interface';

enum EVENTS {
  SUBMISSION_CREATED = 'FILE SUBMISSION CREATED',
  SUBMISSION_REMOVED = 'FILE SUBMISSION REMOVED',
  SUBMISSION_VERIFIED = 'FILE SUBMISSION VERIFIED',
  SUBMISSIONS_VERIFIED = 'FILE SUBMISSIONS VERIFIED',
}

@Injectable()
export class FileSubmissionService {
  private readonly logger = new Logger(FileSubmissionService.name);

  constructor(
    private readonly repository: FileSubmissionRepository,
    private readonly fileRepository: FileRepositoryService,
    private readonly eventEmitter: EventsGateway,
    private readonly submissionPartService: SubmissionPartService,
    private readonly validatorService: ValidatorService,
  ) {}

  async createSubmission(file: UploadedFile, path: string): Promise<FileSubmission> {
    const id = shortid.generate();
    const locations = await this.fileRepository.insertFile(id, file, path);
    const submission: FileSubmission = {
      id,
      type: SubmissionType.FILE,
      title: file.originalname,
      schedule: {},
      primary: {
        location: locations.submissionLocation,
        mimetype: file.mimetype,
        name: file.originalname,
        originalPath: path,
        preview: locations.thumbnailLocation,
        size: file.buffer.length,
        type: getSubmissionType(file.mimetype, file.originalname),
      },
      order: await this.repository.count(),
      created: Date.now(),
    };

    await this.repository.create(submission);
    await this.submissionPartService.createDefaultPart(submission);

    this.eventEmitter.emit(
      EVENTS.SUBMISSION_CREATED,
      submission,
    );

    this.eventEmitter.emitOnComplete(
      EVENTS.SUBMISSION_VERIFIED,
      this.getSubmissionPackage(submission.id),
    );

    return submission;
  }

  async removeSubmission(id: string): Promise<void> {
    await this.fileRepository.removeSubmissionFiles(await this.repository.find(id));
    await this.repository.remove(id);
    this.eventEmitter.emit(EVENTS.SUBMISSION_REMOVED, id);
  }

  async find(id: string): Promise<FileSubmission> {
    return this.repository.find(id);
  }

  getAll(): Promise<FileSubmission[]> {
    return this.repository.findAll();
  }

  async getAllSubmissionPackages(): Promise<Array<SubmissionPackage<FileSubmission>>> {
    const all = await this.getAll();
    // todo mark isPosting
    const results = await Promise.all(all.map(s => this.validate(s)));
    return results.sort((a, b) => a.submission.order - b.submission.order);
  }

  async getSubmissionPackage(id: string): Promise<SubmissionPackage<FileSubmission>> {
    const submission: FileSubmission = await this.repository.find(id);
    // todo mark isPosting
    if (!submission) {
      throw new Error('Submission does not exist');
    }
    return this.validate(submission);
  }

  async setPart(submissionPart: SubmissionPart<any>): Promise<SubmissionPart<any>> {
    const submission: FileSubmission = await this.repository.find(submissionPart.submissionId);
    if (!submission) {
      throw new Error('Submission does not exist');
    }

    const part = await this.submissionPartService.createOrUpdateSubmissionPart(submissionPart, SubmissionType.FILE);
    this.eventEmitter.emit(EVENTS.SUBMISSION_VERIFIED, await this.getSubmissionPackage(submissionPart.submissionId));
    return part;
  }

  async validate(submission: FileSubmission): Promise<SubmissionPackage<FileSubmission>> {
    const parts = await this.submissionPartService.getPartsForSubmission(submission.id);
    const problems = this.validatorService.validateParts(submission, parts);
    return {
      submission,
      parts,
      problems,
    };
  }

  async verifyAllSubmissions(): Promise<void> {
    this.eventEmitter.emitOnComplete(EVENTS.SUBMISSIONS_VERIFIED, this.getAllSubmissionPackages());
  }
}
