import { Injectable, Logger } from '@nestjs/common';
import { FileSubmission } from './interfaces/file-submission.interface';
import { FileRepositoryService } from 'src/file-repository/file-repository.service';
import * as shortid from 'shortid';
import { UploadedFile } from 'src/file-repository/uploaded-file.interface';
import { EventsGateway } from 'src/events/events.gateway';
import { FileSubmissionRepository } from './file-submission.repository';
import { getSubmissionType } from './enums/file-submission-type.enum';
import { SubmissionType } from 'src/submission/interfaces/submission.interface';
import { SubmissionPartService } from '../submission-part/submission-part.service';
import { ValidatorService } from '../validator/validator.service';
import { SubmissionPart } from '../interfaces/submission-part.interface';
import { SubmissionPackage } from '../interfaces/submission-package.interface';
import { SubmissionUpdate } from 'src/submission/interfaces/submission-update.interface';
import { FileSubmissionEvent } from './file-submission.events.enum';
import * as _ from 'lodash';
import { Problems } from '../validator/interfaces/problems.interface';

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
      title: file.originalname,
      type: SubmissionType.FILE,
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
    await this.submissionPartService.createDefaultPart(submission, file.originalname);

    this.eventEmitter.emit(FileSubmissionEvent.CREATED, submission);

    this.eventEmitter.emitOnComplete(
      FileSubmissionEvent.VERIFIED,
      this.getSubmissionPackage(submission.id),
    );

    return submission;
  }

  async changePrimaryFile(file: UploadedFile, id: string, path: string): Promise<FileSubmission> {
    const submission = await this.repository.find(id);
    if (!submission) {
      throw new Error('Submission does not exist');
    }

    await this.fileRepository.removeSubmissionFile(submission.primary);
    const locations = await this.fileRepository.insertFile(submission.id, file, path);
    submission.primary = {
      location: locations.submissionLocation,
      mimetype: file.mimetype,
      name: file.originalname,
      originalPath: path,
      preview: locations.thumbnailLocation,
      size: file.buffer.length,
      type: getSubmissionType(file.mimetype, file.originalname),
    };

    await this.repository.update(id, { primary: submission.primary });

    this.eventEmitter.emitOnComplete(
      FileSubmissionEvent.VERIFIED,
      this.getSubmissionPackage(submission.id),
    );

    return submission;
  }

  async changeThumbnailFile(file: UploadedFile, id: string, path: string): Promise<FileSubmission> {
    const submission = await this.repository.find(id);

    if (!file) {
      throw new Error('No file provided');
    }

    if (
      !(
        file.mimetype.includes('image/jpeg') ||
        file.mimetype.includes('image/jpg') ||
        file.mimetype.includes('image/png')
      )
    ) {
      throw new Error('Thumbnail file must be png or jpeg');
    }

    if (!submission) {
      throw new Error('Submission does not exist');
    }

    if (submission.thumbnail) {
      await this.fileRepository.removeSubmissionFile(submission.thumbnail);
    }

    const scaledUpload = this.fileRepository.scaleImage(file, 640);
    const locations = await this.fileRepository.insertFile(submission.id, file, path);
    submission.thumbnail = {
      location: locations.submissionLocation,
      mimetype: scaledUpload.mimetype,
      name: scaledUpload.originalname,
      originalPath: path,
      preview: locations.thumbnailLocation,
      size: scaledUpload.buffer.length,
      type: getSubmissionType(scaledUpload.mimetype, scaledUpload.originalname),
    };

    await this.repository.update(id, { thumbnail: submission.thumbnail });

    this.eventEmitter.emitOnComplete(
      FileSubmissionEvent.VERIFIED,
      this.getSubmissionPackage(submission.id),
    );

    return submission;
  }

  async removeThumbnail(id: string): Promise<FileSubmission> {
    const submission = await this.repository.find(id);
    if (!submission) {
      throw new Error('Submission does not exist');
    }

    if (submission.thumbnail) {
      await this.fileRepository.removeSubmissionFile(submission.thumbnail);
    }

    const copy = _.cloneDeep(submission);
    delete copy.thumbnail;

    await this.repository.update(id, { thumbnail: null });

    return copy;
  }

  async addAdditionalFile(file: UploadedFile, id: string, path: string): Promise<FileSubmission> {
    const submission = await this.repository.find(id);
    if (!submission) {
      throw new Error('Submission does not exist');
    }

    const copy = _.cloneDeep(submission);
    copy.additional = copy.additional || [];
    const locations = await this.fileRepository.insertFile(submission.id, file, path);
    copy.additional.push({
      location: locations.submissionLocation,
      mimetype: file.mimetype,
      name: file.originalname,
      originalPath: path,
      preview: locations.thumbnailLocation,
      size: file.buffer.length,
      type: getSubmissionType(file.mimetype, file.originalname),
    });

    await this.repository.update(id, { additional: copy.additional });

    this.eventEmitter.emitOnComplete(
      FileSubmissionEvent.VERIFIED,
      this.getSubmissionPackage(submission.id),
    );

    return copy;
  }

  async removeAdditionalFile(id: string, location: string): Promise<FileSubmission> {
    const submission = await this.repository.find(id);
    if (!submission) {
      throw new Error('Submission does not exist');
    }

    const copy = _.cloneDeep(submission);

    if (submission.additional && submission.additional.length) {
      const index = submission.additional.findIndex(a => a.location === location);
      if (index !== -1) {
        await this.fileRepository.removeSubmissionFile(submission.additional[index]);
        copy.additional.splice(index, 1);
      }
    }

    await this.repository.update(id, { additional: copy.additional });

    this.eventEmitter.emitOnComplete(
      FileSubmissionEvent.VERIFIED,
      this.getSubmissionPackage(submission.id),
    );

    return copy;
  }

  async duplicateSubmission(originalId: string): Promise<FileSubmission> {
    this.logger.debug(`Duplicating ${originalId}`, 'FileSubmission Duplicate');
    const toDuplicate = await this.find(originalId);
    if (!toDuplicate) {
      throw new Error('Submission does not exist');
    }

    const id = shortid.generate();

    const duplicate: FileSubmission = _.cloneDeep(toDuplicate);
    delete duplicate._id; // remove autogenerated id
    duplicate.id = id;
    duplicate.created = Date.now();

    // Copy files
    duplicate.primary = await this.fileRepository.copyFileWithNewId(id, duplicate.primary);

    if (duplicate.thumbnail) {
      duplicate.thumbnail = await this.fileRepository.copyFileWithNewId(id, duplicate.thumbnail);
    }

    if (duplicate.additional && duplicate.additional.length) {
      for (let i = 0; i < duplicate.additional.length; i++) {
        duplicate.additional[i] = await this.fileRepository.copyFileWithNewId(
          id,
          duplicate.additional[i],
        );
      }
    }

    this.logger.debug(`Duplicating parts for ${originalId} (${id})`, 'FileSubmission Duplicate');
    const parts = await this.submissionPartService.getPartsForSubmission(originalId);
    const duplicateParts: Array<SubmissionPart<any>> = _.cloneDeep(parts);
    await Promise.all(
      duplicateParts.map(p => {
        p.submissionId = id;
        delete p.id;
        delete p._id;
        return this.submissionPartService.createOrUpdateSubmissionPart(p, SubmissionType.FILE);
      }),
    );

    this.logger.debug(
      `Saving duplicate submission ${id} from ${originalId}`,
      'FileSubmission Duplicate',
    );
    const createdSubmission = await this.repository.create(duplicate);

    this.eventEmitter.emit(FileSubmissionEvent.CREATED, createdSubmission);

    this.eventEmitter.emitOnComplete(FileSubmissionEvent.VERIFIED, this.getSubmissionPackage(id));
    return createdSubmission;
  }

  async removeSubmission(id: string): Promise<void> {
    await this.fileRepository.removeSubmissionFiles(await this.repository.find(id));
    await this.repository.remove(id);
    this.eventEmitter.emit(FileSubmissionEvent.REMOVED, id);
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

    const p: SubmissionPart<any> = {
      _id: submissionPart._id,
      id: submissionPart.id,
      data: submissionPart.data,
      accountId: submissionPart.accountId,
      submissionId: submissionPart.submissionId,
      website: submissionPart.website,
      isDefault: submissionPart.isDefault,
    };

    const part = await this.submissionPartService.createOrUpdateSubmissionPart(
      p,
      SubmissionType.FILE,
    );
    this.eventEmitter.emitOnComplete(
      FileSubmissionEvent.VERIFIED,
      this.getSubmissionPackage(submissionPart.submissionId),
    );
    return part;
  }

  async removePart(submissionPartId: string): Promise<void> {
    await this.submissionPartService.removeSubmissionPart(submissionPartId);
  }

  async setSchedule(id: string, time: number | undefined): Promise<void> {
    const submission: FileSubmission = await this.repository.find(id);
    if (!submission) {
      throw new Error('Submission does not exist');
    }

    const copy = _.cloneDeep(submission);
    copy.schedule.postAt = time;

    await this.repository.update(id, { schedule: copy.schedule });
    this.eventEmitter.emitOnComplete(
      FileSubmissionEvent.VERIFIED,
      this.getSubmissionPackage(id),
    );
  }

  async updateSubmission(update: SubmissionUpdate): Promise<SubmissionPackage<FileSubmission>> {
    await Promise.all(update.parts.map(part => this.setPart(part)));
    await Promise.all(update.removedParts.map(id => this.removePart(id)));
    return this.getSubmissionPackage(update.id);
  }

  async validate(submission: FileSubmission): Promise<SubmissionPackage<FileSubmission>> {
    const parts = await this.submissionPartService.getPartsForSubmission(submission.id);
    const problems = this.validatorService.validateParts(submission, parts);
    const mappedParts = {};
    parts.forEach(part => (mappedParts[part.accountId] = part));
    return {
      submission,
      parts: mappedParts,
      problems,
    };
  }

  async dryValidate(parts: Array<SubmissionPart<any>>): Promise<Problems> {
    if (parts.length) {
      return this.validatorService.validateParts(
        await this.repository.find(parts[0].submissionId),
        parts,
      );
    }

    return {};
  }

  async verifyAllSubmissions(): Promise<void> {
    this.eventEmitter.emitOnComplete(
      FileSubmissionEvent.SUBMISSIONS_VERIFIED,
      this.getAllSubmissionPackages(),
    );
  }
}
