import { Injectable, Logger } from '@nestjs/common';
import { UploadedFile } from './uploaded-file.interface';
import { app, nativeImage } from 'electron';
import * as fs from 'fs-extra';
import { SUBMISSION_FILE_DIRECTORY, THUMBNAIL_FILE_DIRECTORY } from '../directories';
import { FileSubmission } from 'src/submission/file-submission/file-submission.interface';
import * as _ from 'lodash';

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
    const insertSubmissionFile = await fs.outputFile(submissionFilePath, file.buffer);

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

    const insertThumbnailFile = await fs.outputFile(thumbnailFilePath, thumbnail);

    return {
      thumbnailLocation: thumbnailFilePath,
      submissionLocation: submissionFilePath,
    };
  }

  async removeSubmissionFiles(submission: FileSubmission) {
    this.logger.debug(`Removing files for ${submission.id}`);
    const files = [submission.primary, submission.thumbnail, ...(submission.additional || [])];
    const promises = _.flatten(
      files.filter(f => !!f).map(f => [fs.remove(f.location), fs.remove(f.preview)]),
    );
    await Promise.all(promises);
  }
}
