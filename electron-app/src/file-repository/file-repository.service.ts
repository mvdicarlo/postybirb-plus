import { Injectable, Logger } from '@nestjs/common';
import { UploadedFile } from './uploaded-file.interface';
import { app, nativeImage } from 'electron';
import * as fs from 'fs-extra';
import {
  SUBMISSION_FILE_DIRECTORY,
  THUMBNAIL_FILE_DIRECTORY,
} from '../directories';
import { Submission } from 'src/submission/submission.interface';

@Injectable()
export class FileRepositoryService {
  private readonly logger: Logger = new Logger(FileRepositoryService.name);

  async insertFile(
    id: string,
    file: UploadedFile,
    path: string,
  ): Promise<{ thumbnailLocation: string; submissionLocation: string }> {
    this.logger.debug(`Uploading file ${path} ${file.originalname}`);

    const idName = `${id}.${file.originalname.split('.').pop()}`;
    const submissionFilePath = `${SUBMISSION_FILE_DIRECTORY}/${idName}`;
    const insertSubmissionFile = await fs.outputFile(
      submissionFilePath,
      file.buffer,
    );

    let thumbnail: Buffer = null;
    const thumbnailFilePath = `${THUMBNAIL_FILE_DIRECTORY}/${idName}.jpeg`;
    if (file.mimetype.includes('image')) {
      if (file.mimetype.includes('gif')) {
        thumbnail = file.buffer;
      } else {
        const tmp = nativeImage.createFromBuffer(file.buffer);
        const sizes = tmp.getSize();
        thumbnail = tmp
          .resize({
            width: Math.min(sizes.width, 300),
            height: Math.min(sizes.height, 300),
          })
          .toPNG();
      }
    } else {
      thumbnail = (await app.getFileIcon(path)).toJPEG(100);
    }

    const insertThumbnailFile = await fs.outputFile(
      thumbnailFilePath,
      thumbnail,
    );

    return {
      thumbnailLocation: thumbnailFilePath,
      submissionLocation: submissionFilePath,
    };
  }

  async removeSubmissionFiles(submission: Submission) {
    this.logger.debug(`Removing files at\n${JSON.stringify(submission.fileLocations, null, 1)}`);
    const promises = [
      fs.remove(submission.fileLocations.submission),
      fs.remove(submission.fileLocations.thumbnail),
    ];

    if (submission.fileLocations.customThumbnail) {
      promises.push(fs.remove(submission.fileLocations.customThumbnail));
    }

    await Promise.all(promises);
  }
}
