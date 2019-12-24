import {
  Injectable,
  NotFoundException,
  BadRequestException,
  NotImplementedException,
  Logger,
  forwardRef,
  Inject,
} from '@nestjs/common';
import * as _ from 'lodash';
import * as shortid from 'shortid';
import { EventsGateway } from 'src/events/events.gateway';
import { FileSubmission } from './file-submission/interfaces/file-submission.interface';
import { FileSubmissionService } from './file-submission/file-submission.service';
import { Problems } from './validator/interfaces/problems.interface';
import { Submission } from './interfaces/submission.interface';
import { SubmissionCreate } from './interfaces/submission-create.interface';
import { SubmissionEvent } from './enums/submission.events.enum';
import { SubmissionPackage } from './interfaces/submission-package.interface';
import { SubmissionPart, Parts } from './interfaces/submission-part.interface';
import { SubmissionPartService } from './submission-part/submission-part.service';
import { SubmissionRepository } from './submission.repository';
import { SubmissionType } from './enums/submission-type.enum';
import { SubmissionUpdate } from './interfaces/submission-update.interface';
import { ValidatorService } from './validator/validator.service';
import { UploadedFile } from 'src/file-repository/uploaded-file.interface';
import { SubmissionOverwrite } from './interfaces/submission-overwrite.interface';
import { FileRecord } from './file-submission/interfaces/file-record.interface';
import { PostService } from './post/post.service';

@Injectable()
export class SubmissionService {
  private readonly logger = new Logger(SubmissionService.name);

  // TODO handle posting state
  constructor(
    private readonly repository: SubmissionRepository,
    private readonly partService: SubmissionPartService,
    private fileSubmissionService: FileSubmissionService,
    private readonly validatorService: ValidatorService,
    private readonly eventEmitter: EventsGateway,
    @Inject(forwardRef(() => PostService))
    private readonly postService: PostService,
  ) {}

  async get(id: string, packaged?: boolean): Promise<Submission | SubmissionPackage<any>> {
    const submission = await this.repository.find(id);
    if (!submission) {
      throw new NotFoundException(`Submission ${id} could not be found`);
    }

    submission.isPosting = this.postService.isCurrentlyPosting(submission);
    submission.isQueued = this.postService.isCurrentlyQueued(submission);

    return packaged ? await this.validate(submission) : submission;
  }

  async getAll(
    packaged: boolean,
    type?: SubmissionType,
  ): Promise<Array<Submission | SubmissionPackage<any>>> {
    const query: any = {};
    if (type) {
      query.type = type;
    }

    const submissions = await this.repository.findAll(query);
    if (packaged) {
      return await Promise.all(submissions.map(s => this.validate(s)));
    } else {
      return submissions;
    }
  }

  postingStateChanged(): void {
    this.eventEmitter.emitOnComplete(SubmissionEvent.UPDATED, this.getAll(true));
  }

  async create(createDto: SubmissionCreate): Promise<Submission> {
    if (!SubmissionType[createDto.type]) {
      throw new BadRequestException(`Unknown submission type: ${createDto.type}`);
    }

    const id = shortid.generate();
    const submission: Submission = {
      id,
      title: createDto.data.title || id,
      schedule: {},
      type: createDto.type,
      order: await this.repository.count(),
      created: Date.now(),
      sources: [],
    };

    let completedSubmission = null;
    switch (createDto.type) {
      case SubmissionType.FILE:
        completedSubmission = await this.fileSubmissionService.createSubmission(
          submission,
          createDto.data,
        );
        break;
      case SubmissionType.NOTIFICATION:
        completedSubmission = submission;
        break;
    }

    await this.repository.create(completedSubmission);
    await this.partService.createDefaultPart(completedSubmission);
    this.eventEmitter.emitOnComplete(SubmissionEvent.CREATED, this.validate(completedSubmission));
    return completedSubmission;
  }

  async validate(submission: Submission): Promise<SubmissionPackage<any>> {
    const parts = await this.partService.getPartsForSubmission(submission.id);
    const problems: Problems = this.validatorService.validateParts(submission, parts);
    const mappedParts: Parts = {};
    parts.forEach(part => (mappedParts[part.accountId] = part));
    return {
      submission,
      parts: mappedParts,
      problems,
    };
  }

  async verifyAll(): Promise<void> {
    this.eventEmitter.emitOnComplete(SubmissionEvent.UPDATED, this.getAll(true));
  }

  async dryValidate(id: string, parts: Array<SubmissionPart<any>>): Promise<Problems> {
    if (parts.length) {
      return this.validatorService.validateParts(await this.repository.find(id), parts);
    }

    return {};
  }

  async deleteSubmission(id: string): Promise<number> {
    this.logger.log(id, 'Delete Submission');
    const submission = (await this.get(id)) as Submission;
    this.postService.cancel(submission);
    switch (submission.type) {
      case SubmissionType.FILE:
        await this.fileSubmissionService.cleanupSubmission(submission as FileSubmission);
        break;
      case SubmissionType.NOTIFICATION:
        break;
    }

    await this.partService.removeBySubmissionId(id);
    this.eventEmitter.emit(SubmissionEvent.REMOVED, id);
    return this.repository.remove(id);
  }

  async updateSubmission(update: SubmissionUpdate): Promise<SubmissionPackage<any>> {
    this.logger.log(update.id, 'Update Submission');
    const { id, parts, postAt, removedParts } = update;
    const submissionToUpdate = (await this.get(id)) as Submission;

    if (submissionToUpdate.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    submissionToUpdate.schedule.postAt = postAt;
    if (!postAt) {
      submissionToUpdate.schedule.isScheduled = false;
    }
    await this.repository.update(id, { schedule: submissionToUpdate.schedule });

    await Promise.all(removedParts.map(partId => this.partService.removeSubmissionPart(partId)));
    await Promise.all(parts.map(p => this.setPart(submissionToUpdate, p)));

    const packaged: SubmissionPackage<any> = await this.validate(submissionToUpdate);
    this.eventEmitter.emit(SubmissionEvent.UPDATED, [packaged]);

    return packaged;
  }

  async overwriteSubmissionParts(submissionOverwrite: SubmissionOverwrite) {
    const submission = (await this.get(submissionOverwrite.id, false)) as Submission;

    if (submission.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    const allParts = await this.partService.getPartsForSubmission(submission.id);
    const keepIds = submissionOverwrite.parts.map(p => p.accountId);
    const removeParts = allParts.filter(p => !keepIds.includes(p.accountId));

    await Promise.all(submissionOverwrite.parts.map(part => this.setPart(submission, part)));
    await Promise.all(removeParts.map(p => this.partService.removeSubmissionPart(p.id)));

    const packaged: SubmissionPackage<any> = await this.validate(submission);
    this.eventEmitter.emit(SubmissionEvent.UPDATED, [packaged]);
  }

  async scheduleSubmission(id: string, isScheduled: boolean, postAt?: number): Promise<void> {
    this.logger.debug(`${id}: ${isScheduled}`, 'Schedule Submission');
    const submissionToSchedule = (await this.get(id)) as Submission;

    if (submissionToSchedule.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    if (postAt) {
      submissionToSchedule.schedule.postAt = postAt;
    }

    if (!submissionToSchedule.schedule.postAt) {
      throw new BadRequestException(
        'Submission cannot be scheduled because it does not have a postAt value',
      );
    }

    const copy = _.cloneDeep(submissionToSchedule);
    copy.schedule.isScheduled = isScheduled;
    await this.repository.update(id, { schedule: copy.schedule });

    this.eventEmitter.emitOnComplete(SubmissionEvent.UPDATED, Promise.all([this.validate(copy)]));
  }

  async setPart(
    submission: Submission,
    submissionPart: SubmissionPart<any>,
  ): Promise<SubmissionPart<any>> {
    // This might be slower, but it ensures some kind of safety against corruption
    const existingPart = await this.partService.getSubmissionPart(
      submission.id,
      submissionPart.accountId,
    );

    let part: SubmissionPart<any>;
    if (existingPart) {
      part = {
        ...existingPart,
        data: submissionPart.data,
      };
    } else {
      part = {
        _id: submissionPart._id,
        id: submissionPart.id,
        data: submissionPart.data,
        accountId: submissionPart.accountId,
        submissionId: submission.id,
        website: submissionPart.website,
        isDefault: submissionPart.isDefault,
      };
    }

    return await this.partService.createOrUpdateSubmissionPart(part, submission.type);
  }

  async setPostAt(id: string, postAt: number | undefined): Promise<void> {
    this.logger.debug(`${id}: ${new Date(postAt).toLocaleString()}`, 'Update Submission Post At');
    const submission = (await this.get(id)) as Submission;
    if (submission.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }
    submission.schedule.postAt = postAt;
    await this.repository.update(id, { schedule: submission.schedule });
    this.eventEmitter.emitOnComplete(
      SubmissionEvent.UPDATED,
      Promise.all([this.validate(submission)]),
    );
  }

  async duplicate(originalId: string): Promise<Submission> {
    this.logger.log(originalId, 'Duplicate Submission');
    const original = (await this.get(originalId)) as Submission;
    const id = shortid.generate();

    let duplicate = _.cloneDeep(original);
    delete duplicate._id;
    duplicate.id = id;
    duplicate.created = Date.now();

    switch (duplicate.type) {
      case SubmissionType.FILE:
        duplicate = await this.fileSubmissionService.duplicateSubmission(
          duplicate as FileSubmission,
        );
        break;
      case SubmissionType.NOTIFICATION:
        break;
    }

    // Duplicate parts
    const parts = await this.partService.getPartsForSubmission(originalId);
    const duplicateParts: Array<SubmissionPart<any>> = _.cloneDeep(parts);
    await Promise.all(
      duplicateParts.map(p => {
        p.submissionId = id;
        delete p.id;
        delete p._id;
        return this.partService.createOrUpdateSubmissionPart(p, duplicate.type);
      }),
    );

    const createdSubmission = await this.repository.create(duplicate);
    this.eventEmitter.emitOnComplete(SubmissionEvent.CREATED, this.validate(createdSubmission));

    return createdSubmission;
  }

  // File Submission Actions
  // NOTE: Might be good to pull these out into a different place
  async removeFileSubmissionThumbnail(id: string): Promise<SubmissionPackage<FileSubmission>> {
    this.logger.debug(id, 'Remove Submission Thumbnail');
    const submission: FileSubmission = (await this.get(id)) as FileSubmission;

    if (submission.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    const updated = await this.fileSubmissionService.removeThumbnail(submission);
    await this.repository.update(id, { thumbnail: null });

    const validated = await this.validate(updated);
    this.eventEmitter.emit(SubmissionEvent.UPDATED, [validated]);
    return validated;
  }

  async removeFileSubmissionAdditionalFile(
    id: string,
    location: string,
  ): Promise<SubmissionPackage<FileSubmission>> {
    this.logger.debug(location, 'Remove Submission Additional File');
    const submission: FileSubmission = (await this.get(id)) as FileSubmission;

    if (submission.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    const updated = await this.fileSubmissionService.removeAdditionalFile(submission, location);
    await this.repository.update(id, { additional: updated.additional });

    const validated = await this.validate(updated);
    this.eventEmitter.emit(SubmissionEvent.UPDATED, [validated]);
    return validated;
  }

  async changeFileSubmissionThumbnailFile(
    file: UploadedFile,
    id: string,
    path: string,
  ): Promise<SubmissionPackage<FileSubmission>> {
    this.logger.debug(path, 'Change Submission Thumbnail');
    const submission: FileSubmission = (await this.get(id)) as FileSubmission;

    if (submission.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    const updated = await this.fileSubmissionService.changeThumbnailFile(submission, file, path);
    await this.repository.update(id, { thumbnail: updated.thumbnail });

    const validated = await this.validate(updated);
    this.eventEmitter.emit(SubmissionEvent.UPDATED, [validated]);
    return validated;
  }

  async changeFileSubmissionPrimaryFile(
    file: UploadedFile,
    id: string,
    path: string,
  ): Promise<SubmissionPackage<FileSubmission>> {
    const submission: FileSubmission = (await this.get(id)) as FileSubmission;

    if (submission.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    const updated = await this.fileSubmissionService.changePrimaryFile(submission, file, path);
    await this.repository.update(id, { primary: updated.primary });

    const validated = await this.validate(updated);
    this.eventEmitter.emit(SubmissionEvent.UPDATED, [validated]);
    return validated;
  }

  async addFileSubmissionAdditionalFile(
    file: UploadedFile,
    id: string,
    path: string,
  ): Promise<SubmissionPackage<FileSubmission>> {
    this.logger.debug(path, 'Add Additional File');
    const submission: FileSubmission = (await this.get(id)) as FileSubmission;

    if (submission.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    const updated = await this.fileSubmissionService.addAdditionalFile(submission, file, path);
    await this.repository.update(id, { additional: updated.additional });

    const validated = await this.validate(updated);
    this.eventEmitter.emit(SubmissionEvent.UPDATED, [validated]);
    return validated;
  }

  async updateFileSubmissionAdditionalFile(id: string, record: FileRecord) {
    this.logger.debug(record, 'Updating Additional File');
    const submission: FileSubmission = (await this.get(id)) as FileSubmission;

    if (submission.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    if (submission.additional) {
      const recordToUpdate: FileRecord = submission.additional.find(
        r => r.location === record.location,
      );
      if (recordToUpdate) {
        recordToUpdate.ignoredAccounts = record.ignoredAccounts || [];
        this.repository.update(id, { additional: submission.additional });

        this.eventEmitter.emitOnComplete(
          SubmissionEvent.UPDATED,
          Promise.all([this.validate(submission)]),
        );
      }
    }
  }
}
