import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  forwardRef,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import fs from 'fs-extra';
import { EventsGateway } from 'src/server/events/events.gateway';
import { FileSubmissionService } from './file-submission/file-submission.service';
import {
  Problems,
  Submission,
  SubmissionPackage,
  SubmissionPart,
  Parts,
  SubmissionUpdate,
  UploadedFile,
  SubmissionOverwrite,
  FileRecord,
  FileSubmission,
} from 'postybirb-commons';

import { Events } from 'postybirb-commons';

import { SubmissionPartService } from './submission-part/submission-part.service';
import { SubmissionRepository, SubmissionRepositoryToken } from './submission.repository';
import { SubmissionType } from 'postybirb-commons';

import { ValidatorService } from './validator/validator.service';

import { PostService } from './post/post.service';
import { Interval } from '@nestjs/schedule';
import SubmissionEntity from './models/submission.entity';
import SubmissionScheduleModel from './models/submission-schedule.model';
import SubmissionPartEntity from './submission-part/models/submission-part.entity';
import FileSubmissionEntity from './file-submission/models/file-submission.entity';
import SubmissionLogEntity from './log/models/submission-log.entity';

import { AccountService } from 'src/server//account/account.service';
import { WebsiteProvider } from 'src/server/websites/website-provider.service';
import { FileSubmissionType } from 'postybirb-commons';
import SubmissionCreateModel from './models/submission-create.model';
import { enableSleep, preventSleep } from 'src/app/power-save';

type SubmissionEntityReference = string | SubmissionEntity;

@Injectable()
export class SubmissionService {
  private readonly logger = new Logger(SubmissionService.name);

  constructor(
    @Inject(SubmissionRepositoryToken)
    private readonly repository: SubmissionRepository,
    private readonly partService: SubmissionPartService,
    private fileSubmissionService: FileSubmissionService,
    private readonly validatorService: ValidatorService,
    private readonly eventEmitter: EventsGateway,
    @Inject(forwardRef(() => PostService))
    private readonly postService: PostService,
    @Inject(forwardRef(() => AccountService))
    private readonly accountService,
    private readonly websiteProvider: WebsiteProvider,
  ) {
    this.checkForQueuedOrScheduled();
  }

  @Interval(60000)
  async queueScheduledSubmissions() {
    this.logger.debug('Schedule Post Check', 'Schedule Check');
    const submissions: Array<SubmissionPackage<SubmissionEntity>> = await this.getAllAndValidate();
    const now = Date.now();
    submissions
      .filter(p => p.submission.schedule.isScheduled)
      .filter(p => p.submission.schedule.postAt <= now)
      .filter(p => !this.postService.isCurrentlyPosting(p.submission))
      .filter(p => !this.postService.isCurrentlyQueued(p.submission))
      .sort((a, b) => {
        if (a.submission.schedule.postAt === b.submission.schedule.postAt) {
          return a.submission.order - b.submission.order;
        }
        return a.submission.schedule.postAt - b.submission.schedule.postAt;
      })
      .forEach(p => {
        this.scheduleSubmission(p.submission._id, false);
        this.postService.queue(p.submission);
      });
  }

  @Interval(60000)
  async checkForQueuedOrScheduled() {
    this.logger.debug('Queued/Scheduled Check');
    const submissions: Array<SubmissionPackage<any>> = await this.getAllAndValidate();
    const hasScheduled = !!submissions.filter(p => p.submission.schedule.isScheduled).length;
    const hasQueuedOrPosting =
      this.postService.hasAnyQueued() || this.postService.isCurrentlyPostingToAny();

    if (hasQueuedOrPosting || hasScheduled) {
      preventSleep();
    } else {
      enableSleep();
    }
  }

  async get(id: SubmissionEntityReference): Promise<SubmissionEntity> {
    if (id instanceof SubmissionEntity) {
      return id;
    }

    const submission = await this.repository.findOne(id);
    if (!submission) {
      throw new NotFoundException(`Submission ${id} could not be found`);
    }

    submission.isPosting = this.postService.isCurrentlyPosting(submission);
    submission.isQueued = this.postService.isCurrentlyQueued(submission);

    return submission;
  }

  async getAndValidate(id: SubmissionEntityReference): Promise<SubmissionPackage<any>> {
    return this.validate(await this.get(id));
  }

  async getAll(type?: SubmissionType): Promise<SubmissionEntity[]> {
    const query: any = {};
    if (type) {
      query.type = type;
    }

    const submissions = await this.repository.find(query);
    submissions.forEach(submission => {
      submission.isPosting = this.postService.isCurrentlyPosting(submission);
      submission.isQueued = this.postService.isCurrentlyQueued(submission);
    });

    return submissions;
  }

  async getAllAndValidate(type?: SubmissionType): Promise<Array<SubmissionPackage<any>>> {
    return (await Promise.all((await this.getAll(type)).map(s => this.validate(s)))).filter(
      s => Object.keys(s.parts).length,
    ); // filter out submissions that are missing parts entirely (assumes it is currently being deleted)
  }

  postingStateChanged(): void {
    this.eventEmitter.emitOnComplete(Events.SubmissionEvent.UPDATED, this.getAllAndValidate());
  }

  async create(createDto: SubmissionCreateModel): Promise<SubmissionEntity> {
    if (!SubmissionType[createDto.type]) {
      throw new BadRequestException(`Unknown submission type: ${createDto.type}`);
    }

    const submission: SubmissionEntity = new SubmissionEntity({
      title: createDto.title,
      schedule: new SubmissionScheduleModel(),
      type: createDto.type,
      sources: [],
      order: await this.repository.count({ type: createDto.type }),
    });

    let completedSubmission = null;
    try {
      switch (createDto.type) {
        case SubmissionType.FILE:
          completedSubmission = await this.fileSubmissionService.createSubmission(
            submission,
            createDto,
          );
          break;
        case SubmissionType.NOTIFICATION:
          completedSubmission = submission;
          break;
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }

    const { thumbnailFile, thumbnailPath } = createDto;
    if (completedSubmission.primary && thumbnailFile && thumbnailPath) {
      try {
        await this.fileSubmissionService.changeThumbnailFile(
          completedSubmission,
          thumbnailFile,
          thumbnailPath,
        );
      } catch (err) {
        // Failure to set a thumbnail is not fatal, just keep going
        this.logger.error(err.message, err.stack, 'Create Thumbnail Failure');
      }
    }

    try {
      const submission = await this.repository.save(completedSubmission);
      await this.partService.createDefaultPart(completedSubmission);
      if (createDto.parts) {
        const parts: Array<SubmissionPart<any>> = JSON.parse(createDto.parts);
        await Promise.all(
          parts.map(part => {
            delete part._id;
            delete part.lastUpdated;
            delete part.created;
            part.submissionId = submission._id;
            const entity = new SubmissionPartEntity(part);
            return this.partService.createOrUpdateSubmissionPart(entity, submission.type);
          }),
        );
      }
    } catch (err) {
      // Clean up bad data on failure
      this.logger.error(err.message, err.stack, 'Create Failure');
      await this.deleteSubmission(completedSubmission);
      throw new InternalServerErrorException(err);
    }

    this.eventEmitter.emitOnComplete(
      Events.SubmissionEvent.CREATED,
      this.validate(completedSubmission),
    );
    return completedSubmission;
  }

  async recreate(log: SubmissionLogEntity): Promise<Submission> {
    const { submission, parts, defaultPart } = log;
    const createData: SubmissionCreateModel = new SubmissionCreateModel({
      type: submission.type,
      title: submission.title,
    });

    if (createData.type === SubmissionType.FILE) {
      createData.path = (submission as FileSubmission).primary.originalPath;
      createData.file = {
        originalname: (submission as FileSubmission).primary.name,
        mimetype: (submission as FileSubmission).primary.mimetype,
        encoding: '',
        fieldname: 'file',
        buffer: await fs
          .readFile((submission as FileSubmission).primary.originalPath)
          .catch(() => Buffer.from([])), // empty if no file found
      };
    }

    const newSubmission = await this.create(createData);

    try {
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
          for (const additionalFile of fileSubmission.additional) {
            try {
              const buffer = await fs.readFile(additionalFile.originalPath);
              const { mimetype, name, originalPath } = additionalFile;
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
    } catch (err) {
      this.logger.error(err, 'Recreate Failure');
      await this.deleteSubmission(newSubmission);
      throw new InternalServerErrorException(err);
    }

    const s = await this.getAndValidate(newSubmission._id);
    this.eventEmitter.emit(Events.SubmissionEvent.UPDATED, [s]);
    return s.submission;
  }

  async splitAdditionalIntoSubmissions(id: string) {
    this.logger.log(id, 'Splitting Additional Files');
    const submission: FileSubmissionEntity = (await this.get(id)) as FileSubmissionEntity;
    if (!(submission.additional && submission.additional.length)) {
      throw new BadRequestException(
        'Submission is not a File submission or does not have additional files',
      );
    }

    const unsupportedAdditionalWebsites = this.websiteProvider
      .getAllWebsiteModules()
      .filter(w => !w.acceptsAdditionalFiles)
      .map(w => w.constructor.name);

    const parts = await this.partService.getPartsForSubmission(submission._id, true);

    const websitePartsThatNeedSplitting = parts
      .filter(p => !p.isDefault)
      .filter(p => unsupportedAdditionalWebsites.includes(p.website));

    if (!websitePartsThatNeedSplitting.length) {
      return; // Nothing needs to be done
    }

    // Reintroduce default part
    websitePartsThatNeedSplitting.push(parts.find(p => p.isDefault));

    let order: number = submission.order;
    for (const additional of submission.additional) {
      order += 0.01;
      const copy = submission.copy();
      delete copy._id;
      let newSubmission = new FileSubmissionEntity(copy);
      newSubmission.additional = [];
      newSubmission.primary = additional;
      newSubmission.order = order;
      try {
        newSubmission = await this.fileSubmissionService.duplicateSubmission(newSubmission);
        const createdSubmission = await this.repository.save(newSubmission);
        await Promise.all(
          websitePartsThatNeedSplitting.map(p => {
            p.submissionId = newSubmission._id;
            p.postStatus = 'UNPOSTED';
            return this.partService.createOrUpdateSubmissionPart(p, newSubmission.type);
          }),
        );

        this.eventEmitter
          .emitOnComplete(Events.SubmissionEvent.CREATED, this.validate(createdSubmission))
          .then(() => {
            this.orderSubmissions(submission.type);
          });
      } catch (err) {
        this.logger.error(err, 'Additional Split Failure');
        await this.deleteSubmission(newSubmission);
        throw new InternalServerErrorException(err);
      }
    }
  }

  async duplicate(originalId: string): Promise<SubmissionEntity> {
    this.logger.log(originalId, 'Duplicate Submission');
    const original = await this.get(originalId);
    original._id = undefined;

    let duplicate = new SubmissionEntity(original);
    duplicate.order += 0.01;

    switch (duplicate.type) {
      case SubmissionType.FILE:
        duplicate = await this.fileSubmissionService.duplicateSubmission(
          duplicate as FileSubmissionEntity,
        );
        break;
      case SubmissionType.NOTIFICATION:
        break;
    }

    try {
      const createdSubmission = await this.repository.save(duplicate);

      // Duplicate parts
      const parts = await this.partService.getPartsForSubmission(originalId, true);
      await Promise.all(
        parts.map(p => {
          p.submissionId = duplicate._id;
          p.postStatus = 'UNPOSTED';
          return this.partService.createOrUpdateSubmissionPart(p, duplicate.type);
        }),
      );

      this.eventEmitter
        .emitOnComplete(Events.SubmissionEvent.CREATED, this.validate(createdSubmission))
        .then(() => {
          this.orderSubmissions(duplicate.type);
        });

      return createdSubmission;
    } catch (err) {
      this.logger.error(err, 'Duplicate Failure');
      await this.deleteSubmission(duplicate._id);
      throw new InternalServerErrorException(err);
    }
  }

  async changeOrder(id: string, to: number, from: number): Promise<void> {
    const movingSubmission = await this.get(id);
    const submissions = (await this.getAll(movingSubmission.type)).sort(
      (a, b) => a.order - b.order,
    );
    const fromSubmission = submissions.find(s => s._id === id);
    fromSubmission.order = from < to ? to + 0.1 : to - 0.1;
    await Promise.all(
      submissions
        .sort((a, b) => a.order - b.order)
        .map((record, index) => {
          record.order = index;
          return this.repository.update(record);
        }),
    );
    this.orderSubmissions(movingSubmission.type); // somewhat doubles up, but ensures all UI get notified
  }

  async orderSubmissions(type: SubmissionType): Promise<void> {
    const submissions = await this.getAll(type);
    const ordered = submissions
      .sort((a, b) => a.order - b.order)
      .map((record, index) => {
        record.order = index;
        return record;
      });
    await Promise.all(ordered.map(record => this.repository.update(record)));

    const orderRecord: Record<string, number> = {};
    Object.values(ordered).forEach(submission => {
      orderRecord[submission._id] = submission.order;
    });
    this.eventEmitter.emit(Events.SubmissionEvent.REORDER, orderRecord);
  }

  async validate(submission: SubmissionEntityReference): Promise<SubmissionPackage<any>> {
    submission = await this.get(submission);
    let hasProblems: boolean = false;
    const parts = await this.partService.getPartsForSubmission(submission._id, true);
    const problems: Problems = parts.length
      ? await this.validatorService.validateParts(submission, parts)
      : {};
    for (const p of Object.values(problems)) {
      if (p.problems.length) {
        hasProblems = true;
        break;
      }
    }

    const mappedParts: Parts = {};
    parts.forEach(part => (mappedParts[part.accountId] = part.asPlain())); // asPlain to expose the _id (a model might work better)
    return {
      submission,
      parts: mappedParts,
      problems,
      hasProblems,
    };
  }

  async verifyAll(): Promise<void> {
    this.eventEmitter.emitOnComplete(Events.SubmissionEvent.UPDATED, this.getAllAndValidate());
  }

  async dryValidate(
    id: SubmissionEntityReference,
    parts: Array<SubmissionPart<any>>,
  ): Promise<Problems> {
    if (parts.length) {
      return this.validatorService.validateParts(await this.get(id), parts);
    }

    return {};
  }

  async deleteSubmission(id: SubmissionEntityReference, skipCancel?: boolean): Promise<void> {
    const submission = await this.get(id);
    id = submission._id;
    this.logger.log(id, 'Delete Submission');

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

    await this.repository.remove(id);
    await this.partService.removeBySubmissionId(id);
    this.eventEmitter.emit(Events.SubmissionEvent.REMOVED, id);
  }

  async updateSubmission(update: SubmissionUpdate): Promise<SubmissionPackage<any>> {
    this.logger.log(update.id, 'Update Submission');
    const { id, parts, postAt, removedParts } = update;
    const submissionToUpdate = await this.get(id);

    if (submissionToUpdate.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    submissionToUpdate.schedule.postAt = postAt;
    if (!postAt) {
      submissionToUpdate.schedule.isScheduled = false;
    }

    if (submissionToUpdate.type === SubmissionType.FILE && update.altTexts) {
      const fileSubmission = submissionToUpdate as FileSubmissionEntity;
      for (const fileRecord of [fileSubmission.primary, ...(fileSubmission.additional || [])]) {
        const altText = update.altTexts[fileRecord.location];
        if (altText !== undefined && altText != fileRecord.altText) {
          fileRecord.altText = altText;
        }
      }
    }

    await this.repository.update(submissionToUpdate);

    await Promise.all(removedParts.map(partId => this.partService.removeSubmissionPart(partId)));
    await Promise.all(parts.map(p => this.setPart(submissionToUpdate, p)));

    const packaged: SubmissionPackage<any> = await this.validate(submissionToUpdate);
    this.eventEmitter.emit(Events.SubmissionEvent.UPDATED, [packaged]);

    return packaged;
  }

  async overwriteSubmissionParts(submissionOverwrite: SubmissionOverwrite) {
    const submission = await this.get(submissionOverwrite.id);

    if (submission.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    const allParts = await this.partService.getPartsForSubmission(submission._id, false);
    const keepIds = submissionOverwrite.parts.map(p => p.accountId);
    const removeParts = allParts.filter(p => !keepIds.includes(p.accountId) && !p.isDefault);

    await Promise.all(submissionOverwrite.parts.map(part => this.setPart(submission, part)));
    await Promise.all(removeParts.map(p => this.partService.removeSubmissionPart(p._id)));

    const packaged: SubmissionPackage<any> = await this.validate(submission);
    this.eventEmitter.emit(Events.SubmissionEvent.UPDATED, [packaged]);
  }

  async scheduleSubmission(
    id: SubmissionEntityReference,
    isScheduled: boolean,
    postAt?: number,
  ): Promise<void> {
    this.logger.debug(`${id}: ${isScheduled}`, 'Schedule Submission');
    const submissionToSchedule = await this.getAndValidate(id);
    const submission: SubmissionEntity = submissionToSchedule.submission;

    if (isScheduled && submissionToSchedule.hasProblems) {
      throw new BadRequestException('Cannot schedule an incomplete submission');
    }

    if (postAt) {
      submission.schedule.postAt = postAt;
    }

    if (isScheduled && !submission.schedule.postAt) {
      throw new BadRequestException(
        'Submission cannot be scheduled because it does not have a postAt value',
      );
    }

    submission.schedule.isScheduled = isScheduled;
    await this.repository.update(submission);

    this.eventEmitter.emitOnComplete(
      Events.SubmissionEvent.UPDATED,
      Promise.all([this.validate(submission)]),
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
        postedTo: undefined,
        postStatus: 'UNPOSTED',
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

  async setPostAt(id: SubmissionEntityReference, postAt: number | undefined): Promise<void> {
    const submission = await this.get(id);
    this.logger.debug(
      `${submission._id}: ${new Date(postAt).toLocaleString()}`,
      'Update Submission Post At',
    );

    if (submission.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    submission.schedule.postAt = postAt;
    await this.repository.update(submission);
    this.eventEmitter.emitOnComplete(
      Events.SubmissionEvent.UPDATED,
      Promise.all([this.validate(submission)]),
    );
  }

  // File Submission Actions
  // NOTE: Might be good to pull these out into a different place
  async getFallbackText(id: string): Promise<string> {
    const submission: FileSubmissionEntity = (await this.get(id)) as FileSubmissionEntity;
    let text = '';
    if (submission.fallback) {
      try {
        const buf: Buffer = await fs.readFile(submission.fallback.location);
        text = buf.toString();
        // TODO detect latin1?
      } catch (err) {
        // Ignore?
      }
    }

    return text;
  }

  async setFallbackFile(
    file: UploadedFile,
    id: string,
  ): Promise<SubmissionPackage<FileSubmissionEntity>> {
    this.logger.debug(id, 'Change Submission Fallback File');
    const submission: FileSubmissionEntity = (await this.get(id)) as FileSubmissionEntity;

    if (submission.isPosting) {
      throw new BadRequestException('Cannot update a submission that is posting');
    }

    await this.fileSubmissionService.changeFallbackFile(submission, file);
    await this.repository.update(submission);

    const validated = await this.validate(submission);
    this.eventEmitter.emit(Events.SubmissionEvent.UPDATED, [validated]);
    return validated;
  }

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
    this.eventEmitter.emit(Events.SubmissionEvent.UPDATED, [validated]);
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
    this.eventEmitter.emit(Events.SubmissionEvent.UPDATED, [validated]);
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
    this.eventEmitter.emit(Events.SubmissionEvent.UPDATED, [validated]);
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
    if (submission.fallback && submission.primary.type !== FileSubmissionType.TEXT) {
      this.logger.log(id, 'Removing Fallback File');
      await this.fileSubmissionService.removeFallbackFile(submission);
    }

    await this.repository.update(submission);

    const validated = await this.validate(submission);
    this.eventEmitter.emit(Events.SubmissionEvent.UPDATED, [validated]);
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
    this.eventEmitter.emit(Events.SubmissionEvent.UPDATED, [validated]);
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
          Events.SubmissionEvent.UPDATED,
          Promise.all([this.validate(submission)]),
        );
      }
    }
  }
}
