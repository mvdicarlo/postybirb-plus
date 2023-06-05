import { DirectoryEntry, Importer } from './importer';
import { FileSubmissionType, SubmissionType } from 'postybirb-commons';
import { Logger } from '@nestjs/common';
import { SubmissionImporterService } from '../submission-importer.service';
import { getSubmissionType } from '../../file-submission/helpers/file-submission-type.helper';
import * as _ from 'lodash';

function looksLikeSubmissionFile(entry: DirectoryEntry): boolean {
  return (
    entry.type === 'file' &&
    getSubmissionType('unknown/unknown', entry.name) !== FileSubmissionType.UNKNOWN
  );
}

// Imports a flat file list. Doesn't descend into directories.
export class FileListImporter extends Importer {
  private readonly logger = new Logger(FileListImporter.name);

  constructor(service: SubmissionImporterService) {
    super(service);
  }

  override getName(): string {
    return FileListImporter.name;
  }

  override getDisplayName(): string {
    return 'files in directory';
  }

  override identify(tree: DirectoryEntry): boolean {
    return tree.entries.some(looksLikeSubmissionFile);
  }

  override async extract(tree: DirectoryEntry): Promise<number> {
    const entries = _.sortBy(tree.entries, ['name']).filter(looksLikeSubmissionFile);
    const count = entries.length;
    this.tryExtractFiles(entries).then((successes) => {
      this.logger.debug(`${successes}/${count} imported`, 'Imported Finished');
      this.showCompletedNotification(successes, count);
    });
    return count;
  }

  private async tryExtractFiles(entries: DirectoryEntry[]): Promise<number> {
    let successes = 0;
    let current = 0;
    let lastProgress = null;
    for (const entry of entries) {
      try {
        const submission = await this.createSubmission(entry);
        this.logger.debug(submission._id, 'Imported Submission');
        ++successes;
      } catch (err) {
        this.logger.error(`${entry.path}: ${err}`, null, 'Import Error');
        this.showImportError(entry.name);
      }
      ++current;
      lastProgress = this.showImportProgress(current, entries.length, lastProgress);
    }
    return successes;
  }
}
