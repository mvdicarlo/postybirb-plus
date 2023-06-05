import * as fs from 'fs-extra';
import { DirectoryEntry, Importer } from './importers/importer';
import { FaArchiveImporter } from './importers/fa-archive-importer';
import { FileListImporter } from './importers/file-list-importer';
import { Injectable, Logger } from '@nestjs/common';
import { SubmissionImportResult } from 'postybirb-commons';
import { SubmissionService } from '../submission.service';
import { UiNotificationService } from '../../notification/ui-notification/ui-notification.service';
import { basename, join } from 'path';
import { ActivityPubImporter } from './importers/activity-pub-importer';

@Injectable()
export class SubmissionImporterService {
  private readonly logger = new Logger(SubmissionImporterService.name);
  // Importers to try in this order. More specific importers must come first!
  private readonly importers: readonly Importer[] = Object.freeze([
    new FaArchiveImporter(this),
    new ActivityPubImporter(this),
    new FileListImporter(this),
  ]);

  constructor(
    readonly submissionService: SubmissionService,
    readonly uiNotificationService: UiNotificationService,
  ) {}

  async importDirectory(path: string): Promise<SubmissionImportResult> {
    this.logger.debug(path, 'Import Directory');
    const tree: DirectoryEntry = {
      path,
      type: 'directory',
      name: basename(path),
      entries: await this.readTree(path),
    };

    const importer = this.searchImporter(tree);
    if (importer) {
      const importType = importer.getDisplayName();
      const submissionCount = await importer.extract(tree);
      return { importType, submissionCount };
    } else {
      return { importType: null, submissionCount: 0 };
    }
  }

  private async readTree(parent: string): Promise<DirectoryEntry[]> {
    const files = await fs.readdir(parent);
    return await Promise.all(
      files.map(async (name): Promise<DirectoryEntry> => {
        const path = join(parent, name);
        const stat = await fs.lstat(path);
        if (stat.isFile()) {
          return { type: 'file', entries: [], name, path };
        } else if (stat.isDirectory()) {
          return { type: 'directory', entries: await this.readTree(path), name, path };
        } else {
          return { type: 'unknown', entries: [], name, path };
        }
      }),
    );
  }

  private searchImporter(tree: DirectoryEntry): Importer | null {
    for (const importer of this.importers) {
      const name = importer.getName();
      try {
        if (importer.identify(tree)) {
          this.logger.debug('Identified', name);
          return importer;
        } else {
          this.logger.debug('Not identified', name);
        }
      } catch (err) {
        this.logger.error(`${err}`, name);
      }
    }
    return null;
  }
}
