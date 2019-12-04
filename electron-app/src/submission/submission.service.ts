import { Injectable } from '@nestjs/common';
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
import { SubmissionPart } from './interfaces/submission-part.interface';
import { SubmissionPartService } from './submission-part/submission-part.service';
import { SubmissionRepository } from './submission.repository';
import { SubmissionType } from './enums/submission-type.enum';
import { SubmissionUpdate } from './interfaces/submission-update.interface';
import { ValidatorService } from './validator/validator.service';

@Injectable()
export class SubmissionService {
  constructor(
    private readonly repository: SubmissionRepository,
    private readonly partService: SubmissionPartService,
    private fileSubmissionService: FileSubmissionService,
    private readonly validatorService: ValidatorService,
    private readonly eventEmitter: EventsGateway,
  ) {}

  // TODO isPosting flags
  async get(id: string, packaged?: boolean): Promise<Submission | SubmissionPackage<any>> {
    const submission = await this.repository.find(id);
    if (!submission) {
      throw new Error(`Submission ${id} could not be found`);
    }

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

  async create(createDto: SubmissionCreate): Promise<any> {
    if (!SubmissionType[createDto.type]) {
      throw Error(`Unknown submission type: ${createDto.type}`);
    }

    const id = shortid.generate();
    const submission: Submission = {
      id,
      title: id,
      schedule: {},
      type: createDto.type,
      order: await this.repository.count(),
      created: Date.now(),
    };

    let completedSubmission;
    switch (createDto.type) {
      case SubmissionType.FILE:
        completedSubmission = await this.fileSubmissionService.createSubmission(
          submission,
          createDto.data,
        );
        break;
      case SubmissionType.STATUS:
        throw new Error('Type is not implemented yet');
    }

    await this.partService.createDefaultPart(submission);
    this.eventEmitter.emitOnComplete(SubmissionEvent.CREATED, this.validate(completedSubmission));
    return completedSubmission;
  }

  private async validate(submission: Submission): Promise<SubmissionPackage<any>> {
    const parts = await this.partService.getPartsForSubmission(submission.id);
    const problems: Problems = this.validatorService.validateParts(submission, parts);
    const mappedParts: { [key: string]: SubmissionPart<any> } = {};
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

  async dryValidate(parts: Array<SubmissionPart<any>>): Promise<Problems> {
    if (parts.length) {
      return this.validatorService.validateParts(
        await this.repository.find(parts[0].submissionId),
        parts,
      );
    }

    return {};
  }

  async deleteSubmission(id: string): Promise<number> {
    const submission = (await this.get(id)) as Submission;
    switch (submission.type) {
      case SubmissionType.FILE:
        await this.fileSubmissionService.cleanupSubmission(submission as FileSubmission);
        break;
      case SubmissionType.STATUS:
        throw new Error('Unimplemented');
        break;
    }

    await this.partService.removeBySubmissionId(id);
    this.eventEmitter.emit(SubmissionEvent.REMOVED, id);
    return this.repository.remove(id);
  }

  async updateSubmission(update: SubmissionUpdate): Promise<SubmissionPackage<any>> {
    const { id, parts, postAt, removedParts } = update;
    const submissionToUpdate = (await this.get(id)) as Submission;
    submissionToUpdate.schedule.postAt = postAt;
    await this.repository.update(id, { schedule: submissionToUpdate.schedule });

    await Promise.all(removedParts.map(partId => this.partService.removeSubmissionPart(partId)));
    await Promise.all(parts.map(p => this.setPart(submissionToUpdate, p)));

    const packaged: SubmissionPackage<any> = await this.validate(submissionToUpdate);
    this.eventEmitter.emit(SubmissionEvent.UPDATED, [packaged]);

    return packaged;
  }

  async setPart(
    submission: Submission,
    submissionPart: SubmissionPart<any>,
  ): Promise<SubmissionPart<any>> {
    const p: SubmissionPart<any> = {
      _id: submissionPart._id,
      id: submissionPart.id,
      data: submissionPart.data,
      accountId: submissionPart.accountId,
      submissionId: submissionPart.submissionId,
      website: submissionPart.website,
      isDefault: submissionPart.isDefault,
    };

    const part = await this.partService.createOrUpdateSubmissionPart(p, submission.type);
    return part;
  }

  async duplicate(originalId: string): Promise<Submission> {
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
      case SubmissionType.STATUS:
        throw new Error('Unimplemented');
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
}
