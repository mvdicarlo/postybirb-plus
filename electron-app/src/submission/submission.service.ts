import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  forwardRef,
  Inject,
} from '@nestjs/common';
import * as fs from 'fs-extra';
import { EventsGateway } from 'src/events/events.gateway';
import { FileSubmissionService } from './file-submission/file-submission.service';
import { Problems } from './validator/interfaces/problems.interface';
import { Submission } from './interfaces/submission.interface';
import { SubmissionCreate } from './interfaces/submission-create.interface';
import { SubmissionEvent } from './enums/submission.events.enum';
import { SubmissionPackage } from './interfaces/submission-package.interface';
import { SubmissionPart, Parts } from './submission-part/interfaces/submission-part.interface';
import { SubmissionPartService } from './submission-part/submission-part.service';
import { SubmissionRepository } from './submission.repository';
import { SubmissionType } from './enums/submission-type.enum';
import { SubmissionUpdate } from './interfaces/submission-update.interface';
import { ValidatorService } from './validator/validator.service';
import { UploadedFile } from 'src/file-repository/uploaded-file.interface';
import { SubmissionOverwrite } from './interfaces/submission-overwrite.interface';
import { FileRecord } from './file-submission/interfaces/file-record.interface';
import { PostService } from './post/post.service';
import { Interval } from '@nestjs/schedule';
import SubmissionEntity from './models/submission.entity';
import SubmissionScheduleModel from './models/submission-schedule.model';
import SubmissionPartEntity from './submission-part/models/submission-part.entity';
import FileSubmissionEntity from './file-submission/models/file-submission.entity';
import SubmissionLogEntity from './log/models/submission-log.entity';
import { FileSubmission } from './file-submission/interfaces/file-submission.interface';
import { AccountService } from 'src/account/account.service';

@Injectable()
export class SubmissionService {
  private readonly logger = new Logger(SubmissionService.name);

  constructor(
    private readonly repository: SubmissionRepository,
    private readonly partService: SubmissionPartService,
    private fileSubmissionService: FileSubmissionService,
    private readonly validatorService: ValidatorService,
    private readonly eventEmitter: EventsGateway,
    @Inject(forwardRef(() => PostService))
    private readonly postService: PostService,
    @Inject(forwardRef(() => AccountService))
    private readonly accountService,
  ) {}

  @Interval(60000)
  async queueScheduledSubmissions() {
    this.logger.log('Schedule Post Check', 'Schedule Check');
    const submissions: Array<SubmissionPackage<any>> = (await this.getAll(true)) as Array<
      SubmissionPackage<any>
    >;
    const now = Date.now();
    submissions
      .filter(p => p.submission.schedule.isScheduled)
      .filter(p => p.submission.schedule.postAt <= now)
      .filter(p => !this.postService.isCurrentlyPosting(p.submission))
      .filter(p => !this.postService.isCurrentlyQueued(p.submission))
      .sort((a, b) => a.submission.schedule.postAt - b.submission.schedule.postAt)
      .forEach(p => {
        this.scheduleSubmission(p.submission._id, false);
        this.postService.queue(p.submission);
      });
  }

  async get(id: string, packaged?: boolean): Promise<SubmissionEntity | SubmissionPackage<any>> {
    const submission = await this.repository.findOne(id);
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
  ): Promise<Array<SubmissionEntity | SubmissionPackage<any>>> {
    const query: any = {};
    if (type) {
      query.type = type;
    }

    const submissions = await this.repository.find(query);
    submissions.forEach(submission => {
      submission.isPosting = this.postService.isCurrentlyPosting(submission);
      submission.isQueued = this.postService.isCurrentlyQueued(submission);
    });

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

    const submission: SubmissionEntity = new SubmissionEntity({
      title: createDto.data.title,
      schedule: new SubmissionScheduleModel(),
      type: createDto.type,
      sources: [],
    });

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

    await this.repository.save(completedSubmission);
    await this.partService.createDefaultPart(completedSubmission);
    this.eventEmitter.emitOnComplete(SubmissionEvent.CREATED, this.validate(completedSubmission));
    return completedSubmission;
  }

  async recreate(log: SubmissionLogEntity): Promise<Submission> {
    const { submission, parts, defaultPart } = log;
    const createData: SubmissionCreate = {
      type: submission.type,
      data: {
        title: submission.title,
      },
    };

    if (createData.type === SubmissionType.FILE) {
      createData.data = {
        path: (submission as FileSubmission).primary.originalPath,
        file: {
          originalname: (submission as FileSubmission).primary.name,
          mimetype: (submission as FileSubmission).primary.mimetype,
          buffer: await fs
            .readFile((submission as FileSubmission).primary.originalPath)
            .catch(() => Buffer.from([])), // empty if no file found
        },
      };
    }

    const newSubmission = await this.create(createData);

    const submissionParts: Array<SubmissionPartEntity<any>> = parts
      .map(responsePart => responsePart.part)
      .map(part => {
        part.submissionId = newSubmission._id;
        part.postStatus = 'UNPOSTED';
        part.postedTo = undefined;
        return part;
      })
      .filter(async part => {
        try {
          if (part.isDefault) {
            return true;
          }
          await this.accountService.get(part.accountId);
          return true;
        } catch (e) {
          return false;
        }
      })
      .map(part => new SubmissionPartEntity(part));

    const defaultEntity = new SubmissionPartEntity(defaultPart);
    defaultEntity.submissionId = newSubmission._id;

    await Promise.all([
      ...submissionParts.map(p =>
        this.partService.createOrUpdateSubmissionPart(p, newSubmission.type),
      ),
      this.partService.createOrUpdateSubmissionPart(defaultEntity, newSubmission.type),
    ]);

    if (submission.type === SubmissionType.FILE) {
      const fileSubmission = submission as FileSubmission;
      if (fileSubmission.thumbnail) {
        try {
          const buffer = await fs.readFile(fileSubmission.thumbnail.originalPath);
          const { mimetype, name, originalPath } = fileSubmission.thumbnail;
          await this.changeFileSubmissionThumbnailFile(
            {
              fieldname: 'file',
              mimetype,
              originalname: name,
              encoding: '',
              buffer,
            },
            newSubmission._id,
            originalPath,
          );
        } catch (e) {
          // Ignore
        }
      }

      if (fileSubmission.additional && fileSubmission.additional.length) {
        for (let i = 0; i < fileSubmission.additional.length; i++) {
          try {
            const buffer = await fs.readFile(fileSubmission.additional[i].originalPath);
            const { mimetype, name, originalPath } = fileSubmission.additional[i];
            await this.addFileSubmissionAdditionalFile(
              {
                fieldname: 'file',
                mimetype,
                originalname: name,
                encoding: '',
                buffer,
              },
              newSubmission._id,
              originalPath,
            );
          } catch (e) {
            // Ignore dead file
          }
        }
      }
    }

    const s = (await this.get(newSubmission._id, true)) as SubmissionPackage<any>;
    this.eventEmitter.emit(SubmissionEvent.UPDATED, [s]);
    return s.submission;
  }

  async validate(submission: SubmissionEntity): Promise<SubmissionPackage<any>> {
    const parts = await this.partService.getPartsForSubmission(submission._id, true);
    const problems: Problems = this.validatorService.validateParts(submission, parts);
    const mappedParts: Parts = {};
    parts.forEach(part => (mappedParts[part.accountId] = part.asPlain())); // asPlain to expose the _id (a model might work better)
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
      return this.validatorService.validateParts(await this.repository.findOne(id), parts);
    }

    return {};
  }

  async deleteSubmission(id: string, skipCancel?: boolean): Promise<number> {
    this.logger.log(id, 'Delete Submission');
    const submission = (await this.get(id)) as SubmissionEntity;

    if (!skipCancel) {
      this.postService.cancel(submission);
    }

    switch (submission.type) {
      case SubmissionType.FILE:
        await this.fileSubmissionService.cleanupSubmission(submission as FileSubmissionEntity);
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
    const submissionToUpdate = (await this.get(id)) as SubmissionEntity;

    if (submissionToUpdate.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    submissionToUpdate.schedule.postAt = postAt;
    if (!postAt) {
      submissionToUpdate.schedule.isScheduled = false;
    }
    await this.repository.update(submissionToUpdate);

    await Promise.all(removedParts.map(partId => this.partService.removeSubmissionPart(partId)));
    await Promise.all(parts.map(p => this.setPart(submissionToUpdate, p)));

    const packaged: SubmissionPackage<any> = await this.validate(submissionToUpdate);
    this.eventEmitter.emit(SubmissionEvent.UPDATED, [packaged]);

    return packaged;
  }

  async overwriteSubmissionParts(submissionOverwrite: SubmissionOverwrite) {
    const submission = (await this.get(submissionOverwrite.id, false)) as SubmissionEntity;

    if (submission.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    const allParts = await this.partService.getPartsForSubmission(submission._id, false);
    const keepIds = submissionOverwrite.parts.map(p => p.accountId);
    const removeParts = allParts.filter(p => !keepIds.includes(p.accountId));

    await Promise.all(submissionOverwrite.parts.map(part => this.setPart(submission, part)));
    await Promise.all(removeParts.map(p => this.partService.removeSubmissionPart(p._id)));

    const packaged: SubmissionPackage<any> = await this.validate(submission);
    this.eventEmitter.emit(SubmissionEvent.UPDATED, [packaged]);
  }

  async scheduleSubmission(id: string, isScheduled: boolean, postAt?: number): Promise<void> {
    this.logger.debug(`${id}: ${isScheduled}`, 'Schedule Submission');
    const submissionToSchedule = (await this.get(id)) as SubmissionEntity;

    if (postAt) {
      submissionToSchedule.schedule.postAt = postAt;
    }

    if (!submissionToSchedule.schedule.postAt) {
      throw new BadRequestException(
        'Submission cannot be scheduled because it does not have a postAt value',
      );
    }

    submissionToSchedule.schedule.isScheduled = isScheduled;
    await this.repository.update(submissionToSchedule);

    this.eventEmitter.emitOnComplete(
      SubmissionEvent.UPDATED,
      Promise.all([this.validate(submissionToSchedule)]),
    );
  }

  async setPart(
    submission: SubmissionEntity,
    submissionPart: SubmissionPart<any>,
  ): Promise<SubmissionPart<any>> {
    // This might be slower, but it ensures some kind of safety against corruption
    const existingPart = await this.partService.getSubmissionPart(
      submission._id,
      submissionPart.accountId,
    );

    let part: SubmissionPartEntity<any>;
    if (existingPart) {
      part = new SubmissionPartEntity({
        ...existingPart,
        data: submissionPart.data,
      });
    } else {
      part = new SubmissionPartEntity({
        data: submissionPart.data,
        accountId: submissionPart.accountId,
        submissionId: submission._id,
        website: submissionPart.website,
        isDefault: submissionPart.isDefault,
        postedTo: submissionPart.postedTo,
        postStatus: submissionPart.postStatus, // UNSET ON SAVE?
      });
    }

    return await this.partService.createOrUpdateSubmissionPart(part, submission.type);
  }

  async setPostAt(id: string, postAt: number | undefined): Promise<void> {
    this.logger.debug(`${id}: ${new Date(postAt).toLocaleString()}`, 'Update Submission Post At');
    const submission = (await this.get(id)) as SubmissionEntity;
    if (submission.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }
    submission.schedule.postAt = postAt;
    await this.repository.update(submission);
    this.eventEmitter.emitOnComplete(
      SubmissionEvent.UPDATED,
      Promise.all([this.validate(submission)]),
    );
  }

  async duplicate(originalId: string): Promise<Submission> {
    this.logger.log(originalId, 'Duplicate Submission');
    const original = (await this.get(originalId)) as SubmissionEntity;
    original._id = undefined;

    let duplicate = new SubmissionEntity(original);

    switch (duplicate.type) {
      case SubmissionType.FILE:
        duplicate = await this.fileSubmissionService.duplicateSubmission(
          duplicate as FileSubmissionEntity,
        );
        break;
      case SubmissionType.NOTIFICATION:
        break;
    }

    // Duplicate parts
    const parts = await this.partService.getPartsForSubmission(originalId, true);
    await Promise.all(
      parts.map(p => {
        p.submissionId = duplicate._id;
        p.postStatus = 'UNPOSTED';
        return this.partService.createOrUpdateSubmissionPart(p, duplicate.type);
      }),
    );

    const createdSubmission = await this.repository.save(duplicate);
    this.eventEmitter.emitOnComplete(SubmissionEvent.CREATED, this.validate(createdSubmission));

    return createdSubmission;
  }

  // File Submission Actions
  // NOTE: Might be good to pull these out into a different place
  async removeFileSubmissionThumbnail(
    id: string,
  ): Promise<SubmissionPackage<FileSubmissionEntity>> {
    this.logger.debug(id, 'Remove Submission Thumbnail');
    const submission: FileSubmissionEntity = (await this.get(id)) as FileSubmissionEntity;

    if (submission.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    await this.fileSubmissionService.removeThumbnail(submission);
    await this.repository.update(submission);

    const validated = await this.validate(submission);
    this.eventEmitter.emit(SubmissionEvent.UPDATED, [validated]);
    return validated;
  }

  async removeFileSubmissionAdditionalFile(
    id: string,
    location: string,
  ): Promise<SubmissionPackage<FileSubmissionEntity>> {
    this.logger.debug(location, 'Remove Submission Additional File');
    const submission: FileSubmissionEntity = (await this.get(id)) as FileSubmissionEntity;

    if (submission.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    await this.fileSubmissionService.removeAdditionalFile(submission, location);
    await this.repository.update(submission);

    const validated = await this.validate(submission);
    this.eventEmitter.emit(SubmissionEvent.UPDATED, [validated]);
    return validated;
  }

  async changeFileSubmissionThumbnailFile(
    file: UploadedFile,
    id: string,
    path: string,
  ): Promise<SubmissionPackage<FileSubmissionEntity>> {
    this.logger.debug(path, 'Change Submission Thumbnail');
    const submission: FileSubmissionEntity = (await this.get(id)) as FileSubmissionEntity;

    if (submission.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    await this.fileSubmissionService.changeThumbnailFile(submission, file, path);
    await this.repository.update(submission);

    const validated = await this.validate(submission);
    this.eventEmitter.emit(SubmissionEvent.UPDATED, [validated]);
    return validated;
  }

  async changeFileSubmissionPrimaryFile(
    file: UploadedFile,
    id: string,
    path: string,
  ): Promise<SubmissionPackage<FileSubmissionEntity>> {
    const submission: FileSubmissionEntity = (await this.get(id)) as FileSubmissionEntity;

    if (submission.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    await this.fileSubmissionService.changePrimaryFile(submission, file, path);
    await this.repository.update(submission);

    const validated = await this.validate(submission);
    this.eventEmitter.emit(SubmissionEvent.UPDATED, [validated]);
    return validated;
  }

  async addFileSubmissionAdditionalFile(
    file: UploadedFile,
    id: string,
    path: string,
  ): Promise<SubmissionPackage<FileSubmissionEntity>> {
    this.logger.debug(path, 'Add Additional File');
    const submission: FileSubmissionEntity = (await this.get(id)) as FileSubmissionEntity;

    if (submission.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    await this.fileSubmissionService.addAdditionalFile(submission, file, path);
    await this.repository.update(submission);

    const validated = await this.validate(submission);
    this.eventEmitter.emit(SubmissionEvent.UPDATED, [validated]);
    return validated;
  }

  async updateFileSubmissionAdditionalFile(id: string, record: FileRecord) {
    this.logger.debug(record, 'Updating Additional File');
    const submission: FileSubmissionEntity = (await this.get(id)) as FileSubmissionEntity;

    if (submission.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    if (submission.additional) {
      const recordToUpdate: FileRecord = submission.additional.find(
        r => r.location === record.location,
      );
      if (recordToUpdate) {
        recordToUpdate.ignoredAccounts = record.ignoredAccounts || [];
        this.repository.update(submission);

        this.eventEmitter.emitOnComplete(
          SubmissionEvent.UPDATED,
          Promise.all([this.validate(submission)]),
        );
      }
    }
  }
}
