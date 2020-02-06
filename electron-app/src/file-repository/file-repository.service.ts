import * as fs from 'fs-extra';
import * as shortid from 'shortid';
import * as _ from 'lodash';
import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { Injectable, Logger } from '@nestjs/common';
import { SUBMISSION_FILE_DIRECTORY, THUMBNAIL_FILE_DIRECTORY } from 'src/directories';
import { UploadedFile } from './uploaded-file.interface';
import { app, nativeImage } from 'electron';
import * as gifFrames from 'gif-frames';
import ImageManipulator from 'src/file-manipulation/manipulators/image.manipulator';
import { decode } from 'iconv-lite';
import { detect } from 'chardet';

@Injectable()
export class FileRepositoryService {
  private readonly logger: Logger = new Logger(FileRepositoryService.name);

  async insertFile(
    id: string,
    file: UploadedFile,
    path: string,
  ): Promise<{ thumbnailLocation: string; submissionLocation: string }> {
    this.logger.debug(
      `${file.originalname} (${file.mimetype})`,
      `Uploading file ${path ? 'From File' : 'From Clipboard'}`,
    );

    file = this.parseFileUpload(file);
    const fileId = `${id}-${shortid.generate()}`;
    let submissionFilePath: string = `${SUBMISSION_FILE_DIRECTORY}/${fileId}.${file.originalname
      .split('.')
      .pop()}`;
    let thumbnailFilePath = `${THUMBNAIL_FILE_DIRECTORY}/${fileId}.jpg`;

    let thumbnail: Buffer = null;
    if (file.mimetype.includes('image')) {
      if (file.mimetype.includes('gif')) {
        await fs.outputFile(submissionFilePath, file.buffer);
        const [frame0] = await gifFrames({ url: file.buffer, frames: 0 });
        const im: ImageManipulator = ImageManipulator.build(frame0.getImage().read(), 'image/jpeg');
        thumbnail = im.resize(300).getBuffer();
      } else if (ImageManipulator.isMimeType(file.mimetype)) {
        const im: ImageManipulator = ImageManipulator.build(file.buffer, file.mimetype);

        // Update file properties to match manipulations
        file.mimetype = im.getMimeType();
        file.originalname = `${file.originalname}.${im.getExtension()}`;
        file.buffer = im.getBuffer();

        submissionFilePath = await im.writeTo(SUBMISSION_FILE_DIRECTORY, fileId);
        thumbnail = im
          .toPNG()
          .resize(300)
          .getBuffer();
        thumbnailFilePath = im.buildFilePath(THUMBNAIL_FILE_DIRECTORY, fileId);
      } else {
        // Unsupported file for manipulation
        await fs.outputFile(submissionFilePath, file.buffer);
        thumbnail = (await app.getFileIcon(path)).toPNG();
      }
    } else {
      // Non-image saving
      await fs.outputFile(submissionFilePath, file.buffer);
      thumbnail = (await app.getFileIcon(path)).toJPEG(100);
    }

    await fs.outputFile(thumbnailFilePath, thumbnail);

    return {
      thumbnailLocation: thumbnailFilePath,
      submissionLocation: submissionFilePath,
    };
  }

  async insertFileDirectly(file: UploadedFile, filename: string): Promise<string> {
    const filepath = `${SUBMISSION_FILE_DIRECTORY}/${filename}`;
    file = this.parseFileUpload(file);
    await fs.outputFile(filepath, file.buffer);
    return filepath;
  }

  async removeSubmissionFiles(submission: FileSubmission) {
    this.logger.debug(submission._id, 'Removing Files');
    const files = [
      submission.primary,
      submission.thumbnail,
      submission.fallback,
      ...(submission.additional || []),
    ];
    await Promise.all(files.filter(f => !!f).map(f => this.removeSubmissionFile(f)));
  }

  scaleImage(file: UploadedFile, w: number): UploadedFile {
    let image = nativeImage.createFromBuffer(file.buffer);
    const { width } = image.getSize();
    if (width > w) {
      image = image.resize({
        width: w,
        height: w / image.getAspectRatio(),
      });
    }
    const copy = _.cloneDeep(file);
    copy.buffer = image.toJPEG(100);
    copy.mimetype = 'image/jpeg';
    return copy;
  }

  async removeSubmissionFile(record: FileRecord): Promise<void> {
    this.logger.debug(record.location, 'Remove Submission File');
    if (record.location) {
      await fs.remove(record.location);
    }
    if (record.preview) {
      await fs.remove(record.preview);
    }
  }

  async copyFileWithNewId(id: string, file: FileRecord): Promise<FileRecord> {
    this.logger.debug(`Copying file ${file.location} with name ${id}`, 'Copy File');
    const pathParts = file.location.split('/');
    pathParts.pop();
    const extension = file.location.split('.').pop();
    const newId = `${id}-${shortid.generate()}`;
    const filePath = [...pathParts, `${newId}.${extension}`].join('/');

    await fs.copy(file.location, filePath);
    file.location = filePath;

    if (file.preview) {
      const thumbPathParts = file.preview.split('/');
      thumbPathParts.pop();
      const thumbPath = [...thumbPathParts, `${newId}.jpg`].join('/');

      await fs.copy(file.preview, thumbPath);
      file.preview = thumbPath;
    }

    return file;
  }

  private parseFileUpload(file: UploadedFile): UploadedFile {
    if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
      const encoding = detect(file.buffer);
      file.buffer = Buffer.from(decode(file.buffer, encoding));
    }
    return file;
  }
}
