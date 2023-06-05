import SubmissionCreateModel from '../../models/submission-create.model';
import SubmissionEntity from '../../models/submission.entity';
import { NotificationType } from 'src/server/notification/enums/notification-type.enum';
import { SubmissionCreate, SubmissionType, UploadedFile } from 'postybirb-commons';
import { SubmissionImporterService } from '../submission-importer.service';
import { basename } from 'path';
import * as filetype from 'file-type';
import * as fs from 'fs-extra';
import * as domutils from 'domutils';
import * as htmlparser2 from 'htmlparser2';
import render from 'dom-serializer';
import { Element, Node, NodeWithChildren } from 'domhandler';

export interface DirectoryEntry {
  type: 'file' | 'directory' | 'unknown';
  name: string;
  path: string;
  entries: DirectoryEntry[];
}

export interface Entry {
  name?: string;
  path: string;
}

export abstract class Importer {
  constructor(protected readonly service: SubmissionImporterService) {}

  // Technical name for this importer.
  abstract getName(): string;

  // A humane name for this importer, shown to the user.
  abstract getDisplayName(): string;

  // Check if this looks like something this importer understands.
  abstract identify(tree: DirectoryEntry): boolean;

  // Perform the actual import, return number of submissions processed.
  // The actual import should happen asynchronously, as to not lock up the UI.
  abstract extract(tree: DirectoryEntry): Promise<number>;

  protected async createSubmission(
    entry: Entry,
    defaultPartData?: any,
    thumbnailEntry?: Entry,
  ): Promise<SubmissionEntity> {
    const create: SubmissionCreate = {
      type: SubmissionType.FILE,
      file: await this.readUploadedFile(entry),
      path: entry.path,
      parts: defaultPartData ? this.buildParts(defaultPartData) : null,
    };
    if (thumbnailEntry) {
      create.thumbnailFile = await this.readUploadedFile(thumbnailEntry);
      create.thumbnailPath = thumbnailEntry.path;
    }
    return this.service.submissionService.create(new SubmissionCreateModel(create));
  }

  private buildParts(defaultPartData: any): string {
    return JSON.stringify([
      {
        accountId: 'default',
        website: 'default',
        isDefault: true,
        data: defaultPartData,
      },
    ]);
  }

  protected async readUploadedFile({ name, path }: Entry): Promise<UploadedFile> {
    const [buffer, mimetype] = await this.readFile(path);
    return {
      fieldname: null,
      originalname: name || basename(path),
      encoding: null,
      mimetype,
      buffer,
    };
  }

  // Reads a file, returns content and mime type.
  protected async readFile(path: string): Promise<[Buffer, string]> {
    const buffer = await fs.readFile(path);
    const mimetype = filetype(buffer)?.mime || 'application/octet-stream';
    return [buffer, mimetype];
  }

  protected showCompletedNotification(successes: number, total: number): void {
    this.service.uiNotificationService.createUINotification(
      NotificationType.INFO,
      10,
      `Imported ${successes}/${total} submission(s) from ${this.getDisplayName()}.`,
      'Import finished',
    );
  }

  protected showImportProgress(
    current: number,
    total: number,
    lastProgress: number | null,
  ): number {
    if (lastProgress === null) {
      return Date.now();
    } else if (Date.now() < lastProgress + 3000) {
      return lastProgress;
    } else {
      this.service.uiNotificationService.createUIMessage(
        NotificationType.INFO,
        2,
        `Importing ${current}/${total} from ${this.getDisplayName()}.`,
      );
      return Date.now();
    }
  }

  protected showImportError(name: string): void {
    this.service.uiNotificationService.createUIMessage(
      NotificationType.ERROR,
      10,
      `Error importing ${name} from ${this.getDisplayName()}.`,
    );
  }

  protected scrubHtmlDescription(description: string): string {
    const doc = htmlparser2.parseDocument(description);
    return render(this.scrubHtmlNode(doc));
  }

  protected scrubHtmlNode(node: Node): Node | null {
    const scrubbed = htmlparser2.ElementType.isTag(node)
      ? this.scrubHtmlElement(node as Element)
      : node;

    if (!scrubbed) {
      domutils.removeElement(node);
      return null;
    } else if (scrubbed !== node) {
      domutils.replaceElement(node, scrubbed);
    }

    if ('children' in scrubbed) {
      for (const child of [...(scrubbed as NodeWithChildren).children]) {
        this.scrubHtmlNode(child);
      }
    }

    return scrubbed;
  }

  protected scrubHtmlElement(element: Element): Node | null {
    // Override me. Return either the same element, a replacement node or null
    // to remove the element from the tree altogether.
    return element;
  }
}
