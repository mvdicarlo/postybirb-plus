import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { FileSubmission, UploadedFile } from 'postybirb-commons';
import { FileManagerService } from 'src/server/file-manager/file-manager.service';

import { getSubmissionType } from './helpers/file-submission-type.helper';
import { FileSubmissionType } from 'postybirb-commons';
import FileSubmissionEntity from './models/file-submission.entity';
import SubmissionEntity from '../models/submission.entity';
import SubmissionCreateModel from '../models/submission-create.model';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import { ImageManipulationPoolService } from 'src/server/file-manipulation/pools/image-manipulation-pool.service';

import path from 'path';

@Injectable()
export class FileSubmissionService {
  private readonly logger = new Logger(FileSubmissionService.name);

  constructor(
    private readonly fileRepository: FileManagerService,
    private readonly imageManipulationPool: ImageManipulationPoolService,
  ) {}

  async createSubmission(
    submission: SubmissionEntity,
    data: SubmissionCreateModel,
  ): Promise<FileSubmission> {
    const { file } = data;
    if (!file) {
      throw new BadRequestException('FileSubmission requires a file');
    }

    const title = path.parse(file.originalname).name;
    const locations = await this.fileRepository.insertFile(submission._id, file, data.path);

    // file mimetype may be manipulated by insertFile
    const completedSubmission: FileSubmissionEntity = new FileSubmissionEntity({
      ...submission,
      title,
      primary: {
        location: locations.submissionLocation,
        mimetype: file.mimetype,
        name: file.originalname,
        originalPath: data.path,
        preview: locations.thumbnailLocation,
        size: file.buffer.length,
        type: getSubmissionType(file.mimetype, file.originalname),
      },
    });

    if (file.mimetype.includes('image/jpeg') || file.mimetype.includes('image/png')) {
      const im: ImageManipulator = await this.imageManipulationPool.getImageManipulator(
        file.buffer,
        file.mimetype,
      );

      completedSubmission.primary.height = im.getHeight();
      completedSubmission.primary.width = im.getWidth();

      im.destroy();
    }

    return completedSubmission;
  }

  async cleanupSubmission(submission: FileSubmission | FileSubmissionEntity): Promise<void> {
    await this.fileRepository.removeSubmissionFiles(submission);
  }

  async changePrimaryFile(
    submission: FileSubmissionEntity,
    file: UploadedFile,
    path: string,
  ): Promise<FileSubmissionEntity> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    await this.fileRepository.removeSubmissionFile(submission.primary);
    const locations = await this.fileRepository.insertFile(submission._id, file, path);

    submission.primary = {
      location: locations.submissionLocation,
      mimetype: file.mimetype,
      name: file.originalname,
      originalPath: path,
      preview: locations.thumbnailLocation,
      size: file.buffer.length,
      type: getSubmissionType(file.mimetype, file.originalname),
    };

    if (file.mimetype.includes('image/jpeg') || file.mimetype.includes('image/png')) {
      const im: ImageManipulator = await this.imageManipulationPool.getImageManipulator(
        file.buffer,
        file.mimetype,
      );

      submission.primary.height = im.getHeight();
      submission.primary.width = im.getWidth();

      im.destroy();
    }

    return submission;
  }

  async changeThumbnailFile(
    submission: FileSubmissionEntity,
    file: UploadedFile,
    path: string,
  ): Promise<FileSubmissionEntity> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!(file.mimetype.includes('image/jpeg') || file.mimetype.includes('image/png'))) {
      throw new BadRequestException('Thumbnail file must be png or jpeg');
    }

    if (submission.thumbnail) {
      await this.fileRepository.removeSubmissionFile(submission.thumbnail);
    }

    const scaledUpload = this.fileRepository.scaleImage(file, 640);
    const locations = await this.fileRepository.insertFile(submission._id, file, path);

    submission.thumbnail = {
      location: locations.submissionLocation,
      mimetype: scaledUpload.mimetype,
      name: scaledUpload.originalname,
      originalPath: path,
      preview: locations.thumbnailLocation,
      size: scaledUpload.buffer.length,
      type: getSubmissionType(scaledUpload.mimetype, scaledUpload.originalname),
    };

    if (file.mimetype.includes('image/jpeg') || file.mimetype.includes('image/png')) {
      const im: ImageManipulator = await this.imageManipulationPool.getImageManipulator(
        scaledUpload.buffer,
        scaledUpload.mimetype,
      );

      submission.thumbnail.width = im.getWidth();
      submission.thumbnail.height = im.getHeight();

      im.destroy();
    }

    return submission;
  }

  async changeFallbackFile(
    submission: FileSubmissionEntity,
    file: UploadedFile,
  ): Promise<FileSubmissionEntity> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (submission.fallback) {
      await this.fileRepository.removeSubmissionFile(submission.fallback);
    }

    const location = await this.fileRepository.insertFileDirectly(
      file,
      `${submission._id}-fallback.html`,
    );
    submission.fallback = {
      location,
      mimetype: 'text/html',
      name: `${submission._id}-fallback.html`,
      originalPath: '',
      preview: '',
      size: file.buffer.length,
      type: FileSubmissionType.TEXT,
    };

    return submission;
  }

  async removeFallbackFile(submission: FileSubmissionEntity): Promise<FileSubmissionEntity> {
    if (submission.fallback) {
      await this.fileRepository.removeSubmissionFile(submission.fallback);
      submission.fallback = undefined;
    }

    return submission;
  }

  async removeThumbnail(submission: FileSubmissionEntity): Promise<FileSubmissionEntity> {
    if (submission.thumbnail) {
      await this.fileRepository.removeSubmissionFile(submission.thumbnail);
      submission.thumbnail = undefined;
    }

    return submission;
  }

  async addAdditionalFile(
    submission: FileSubmissionEntity,
    file: UploadedFile,
    path: string,
  ): Promise<FileSubmissionEntity> {
    const locations = await this.fileRepository.insertFile(submission._id, file, path);
    let additionalSub = {
      location: locations.submissionLocation,
      mimetype: file.mimetype,
      name: file.originalname,
      originalPath: path,
      preview: locations.thumbnailLocation,
      size: file.buffer.length,
      type: getSubmissionType(file.mimetype, file.originalname),
      ignoredAccounts: [],
      height: 0,
      width: 0,
    };

    if (file.mimetype.includes('image/jpeg') || file.mimetype.includes('image/png')) {
      const im: ImageManipulator = await this.imageManipulationPool.getImageManipulator(
        file.buffer,
        file.mimetype,
      );

      additionalSub.height = im.getHeight();
      additionalSub.width = im.getWidth();

      im.destroy();
    }

    submission.additional.push(additionalSub);

    return submission;
  }

  async removeAdditionalFile(
    submission: FileSubmissionEntity,
    location: string,
  ): Promise<FileSubmissionEntity> {
    if (submission.additional && submission.additional.length) {
      const index = submission.additional.findIndex(a => a.location === location);
      if (index !== -1) {
        await this.fileRepository.removeSubmissionFile(submission.additional[index]);
        submission.additional.splice(index, 1);
      }
    }

    return submission;
  }

  async duplicateSubmission(submission: FileSubmissionEntity): Promise<FileSubmissionEntity> {
    // Copy files
    const { _id } = submission;
    const duplicate = submission.copy();
    duplicate.primary = await this.fileRepository.copyFileWithNewId(_id, duplicate.primary);

    if (duplicate.thumbnail) {
      duplicate.thumbnail = await this.fileRepository.copyFileWithNewId(_id, duplicate.thumbnail);
    }

    if (duplicate.fallback) {
      duplicate.fallback = await this.fileRepository.copyFileWithNewId(_id, duplicate.fallback);
    }

    if (duplicate.additional && duplicate.additional.length) {
      for (let i = 0; i < duplicate.additional.length; i++) {
        duplicate.additional[i] = await this.fileRepository.copyFileWithNewId(
          _id,
          duplicate.additional[i],
        );
      }
    }

    return duplicate;
  }
}
