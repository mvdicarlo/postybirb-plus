import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { FileSubmission } from './interfaces/file-submission.interface';
import { FileRepositoryService } from 'src/file-repository/file-repository.service';
import { UploadedFile } from 'src/file-repository/uploaded-file.interface';
import { getSubmissionType, FileSubmissionType } from './enums/file-submission-type.enum';
import FileSubmissionEntity from './models/file-submission.entity';
import SubmissionEntity from '../models/submission.entity';

@Injectable()
export class FileSubmissionService {
  private readonly logger = new Logger(FileSubmissionService.name);

  constructor(private readonly fileRepository: FileRepositoryService) {}

  async createSubmission(
    submission: SubmissionEntity,
    data: { file: UploadedFile; path: string },
  ): Promise<FileSubmission> {
    const { file, path } = data;
    if (!file) {
      throw new BadRequestException('FileSubmission requires a file');
    }

    const title = file.originalname;
    const locations = await this.fileRepository.insertFile(submission._id, file, path);
    // file mimetype may be manipulated by insertFile
    const completedSubmission: FileSubmissionEntity = new FileSubmissionEntity({
      ...submission,
      title,
      primary: {
        location: locations.submissionLocation,
        mimetype: file.mimetype,
        name: file.originalname,
        originalPath: path,
        preview: locations.thumbnailLocation,
        size: file.buffer.length,
        type: getSubmissionType(file.mimetype, file.originalname),
      },
    });

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
      `${submission._id}-fallback.md`,
    );
    submission.fallback = {
      location,
      mimetype: 'text/markdown',
      name: `${submission._id}-fallback.md`,
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
    submission.additional.push({
      location: locations.submissionLocation,
      mimetype: file.mimetype,
      name: file.originalname,
      originalPath: path,
      preview: locations.thumbnailLocation,
      size: file.buffer.length,
      type: getSubmissionType(file.mimetype, file.originalname),
      ignoredAccounts: [],
    });

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
