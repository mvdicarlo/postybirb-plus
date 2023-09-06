import { Injectable, Logger } from '@nestjs/common';
import { detect } from 'chardet';
import { app, nativeImage } from 'electron';
import fs from 'fs-extra';
import { decode } from 'iconv-lite';
import _ from 'lodash';
import path from 'path';
import { FileRecord, FileSubmission, UploadedFile } from 'postybirb-commons';
import shortid from 'shortid';
import { SUBMISSION_FILE_DIRECTORY, THUMBNAIL_FILE_DIRECTORY } from 'src/server/directories';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import { ImageManipulationPoolService } from 'src/server/file-manipulation/pools/image-manipulation-pool.service';
import { GifManipulator } from '../file-manipulation/manipulators/gif.manipulator';

@Injectable()
export class FileManagerService {
  private readonly logger: Logger = new Logger(FileManagerService.name);

  constructor(private readonly imageManipulationPool: ImageManipulationPoolService) {}

  async insertFile(
    id: string,
    file: UploadedFile,
    filePath: string,
  ): Promise<{ thumbnailLocation: string; submissionLocation: string }> {
    this.logger.debug(
      `${file.originalname} (${file.mimetype})`,
      `Uploading file ${filePath ? 'From File' : 'From Clipboard'}`,
    );

    file = this.parseFileUpload(file);
    const fileId = `${id}-${shortid.generate()}`;
    const ext = path.extname(file.originalname);
    let submissionFilePath: string = path.format({
      dir: SUBMISSION_FILE_DIRECTORY,
      name: fileId,
      ext,
    });

    let thumbnailFilePath = `${THUMBNAIL_FILE_DIRECTORY}/${fileId}${ext}`;
    let thumbnail: Buffer = null;
    if (file.mimetype.includes('image')) {
      if (file.mimetype === 'image/gif') {
        await fs.outputFile(submissionFilePath, file.buffer);

        const frame0 = await GifManipulator.getFrame(file.buffer);
        const im: ImageManipulator = await this.imageManipulationPool.getImageManipulator(
          frame0,
          'image/jpeg',
        );
        thumbnail = (await im.resize(300).setQuality(99).getData()).buffer;
      } else if (ImageManipulator.isMimeType(file.mimetype)) {
        const im: ImageManipulator = await this.imageManipulationPool.getImageManipulator(
          file.buffer,
          file.mimetype,
        );
        try {
          // Update file properties to match manipulations
          if (file.mimetype === 'image/tiff') {
            im.toPNG();
          }
          const data = await im.getData();
          file.mimetype = data.type;
          file.buffer = data.buffer;

          submissionFilePath = path.format({
            dir: SUBMISSION_FILE_DIRECTORY,
            name: fileId,
            ext: `.${ImageManipulator.getExtension(data.type)}`,
          });

          const thumbnailData = await im.resize(300).setQuality(99).getData();
          thumbnail = thumbnailData.buffer;
          thumbnailFilePath = `${THUMBNAIL_FILE_DIRECTORY}/${fileId}.${ImageManipulator.getExtension(
            thumbnailData.type,
          )}`;
        } catch (err) {
          this.logger.error(err.message, err.stack);
          throw err;
        } finally {
          im.destroy();
        }
      } else {
        // Unsupported file for manipulation
        thumbnail = file.buffer;
      }
    } else {
      // Non-image saving
      thumbnailFilePath = path.format({ dir: THUMBNAIL_FILE_DIRECTORY, name: fileId, ext: '.jpg' });
      try {
        thumbnail = (await app.getFileIcon(filePath)).toJPEG(100);
      } catch (err) {
        // Ignore? Should only fail on remote.
      }
    }

    await fs.outputFile(submissionFilePath, file.buffer);
    await fs.outputFile(
      thumbnailFilePath,
      thumbnail ? thumbnail : (await app.getFileIcon(submissionFilePath)).toJPEG(100),
    );
    return {
      thumbnailLocation: thumbnailFilePath,
      submissionLocation: submissionFilePath,
    };
  }

  async insertFileDirectly(file: UploadedFile, filename: string): Promise<string> {
    const filepath = path.format({ dir: SUBMISSION_FILE_DIRECTORY, name: filename });
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

  scaleImage(file: UploadedFile, scalePx: number): UploadedFile {
    let image = nativeImage.createFromBuffer(file.buffer);
    const { width, height } = image.getSize();
    const ar = image.getAspectRatio();
    if (ar >= 1) {
      if (width > scalePx) {
        image = image.resize({
          width: scalePx,
          height: scalePx / ar,
        });
      }
    } else {
      if (height > scalePx) {
        image = image.resize({
          width: scalePx * ar,
          height: scalePx,
        });
      }
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
    const parts = path.parse(file.location);
    const newId = `${id}-${shortid.generate()}`;
    const filePath = path.format({ dir: parts.dir, name: newId, ext: parts.ext });
    await fs.copy(file.location, filePath);
    file.location = filePath;

    if (file.preview) {
      const thumbPathParts = path.parse(file.preview);
      const thumbPath = path.format({ dir: thumbPathParts.dir, name: newId, ext: '.jpg' });
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
