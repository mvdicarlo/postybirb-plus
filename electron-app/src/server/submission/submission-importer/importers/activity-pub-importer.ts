import * as _ from 'lodash';
import * as fs from 'fs-extra';
import { DirectoryEntry, Importer } from './importer';
import { Element, Node } from 'domhandler';
import { FileSubmissionType } from 'postybirb-commons';
import { Logger } from '@nestjs/common';
import { SubmissionImporterService } from '../submission-importer.service';
import { SubmissionRating } from 'postybirb-commons';
import { getSubmissionType } from '../../file-submission/helpers/file-submission-type.helper';
import { join } from 'path';

interface ActivityPubImportAttachment {
  path: string;
  altText: string;
}

interface ActivityPubImport {
  id: string;
  content: string;
  sensitive: boolean;
  summary: string;
  published: string;
  attachments: ActivityPubImportAttachment[];
  tags: string[];
}

interface ActivityPubOutboxItem {
  type: string;
  to?: string[];
  cc?: string[];
  object?: {
    type: string;
    id: string;
    published: string;
    summary?: string;
    sensitive?: boolean;
    content?: string;
    attachment?: {
      type: string;
      mediaType?: string;
      url?: string;
      name?: string;
    }[];
    tag?: {
      type: string;
      name?: string;
    }[];
  };
}

interface ActivityPubOutbox {
  orderedItems?: ActivityPubOutboxItem[];
}

function looksLikeSubmission(mimetype: string, name: string): boolean {
  return getSubmissionType(mimetype, name) !== FileSubmissionType.UNKNOWN;
}

// Imports dumps from ActivityPub exports, such as produced by Mastodon
export class ActivityPubImporter extends Importer {
  private readonly logger = new Logger(ActivityPubImporter.name);

  constructor(service: SubmissionImporterService) {
    super(service);
  }

  override getName(): string {
    return ActivityPubImporter.name;
  }

  override getDisplayName(): string {
    return 'ActivityPub export';
  }

  override identify(tree: DirectoryEntry): boolean {
    // Technically we just need an outbox.json, but there's always going to be
    // an actor.json too, so we use that as circumstantial evidence.
    let hasActorJson = false;
    let hasOutboxJson = false;
    for (const { type, name } of tree.entries) {
      if (type === 'file') {
        if (name === 'actor.json') {
          hasActorJson = true;
        } else if (name === 'outbox.json') {
          hasOutboxJson = true;
        }
      }
    }
    return hasActorJson && hasOutboxJson;
  }

  override async extract(tree: DirectoryEntry): Promise<number> {
    const imports: ActivityPubImport[] = [];
    const outbox = await this.parseOutboxJson(tree);
    for (const item of outbox.orderedItems || []) {
      const imp = this.extractItem(tree, item);
      if (imp) {
        imports.push(imp);
      }
    }

    const count = imports.length;
    this.tryExtractImports(imports).then((successes) => {
      this.logger.debug(`${successes}/${count} imported`, 'Imported Finished');
      this.showCompletedNotification(successes, count);
    });
    return count;
  }

  private async parseOutboxJson({ entries }: DirectoryEntry): Promise<ActivityPubOutbox> {
    for (const entry of entries) {
      if (entry.type === 'file' && entry.name === 'outbox.json') {
        const text = await fs.readFile(entry.path, 'utf-8');
        return JSON.parse(text);
      }
    }
    throw Error('No outbox.json found');
  }

  private extractItem(
    { path }: DirectoryEntry,
    item: ActivityPubOutboxItem,
  ): ActivityPubImport | null {
    if (item?.type !== 'Create') {
      return null;
    }

    if(this.looksLikeDirectMessage(item)) {
      return null;
    }

    const object = item.object;
    if (object?.type !== 'Note' || !object.attachment) {
      return null;
    }

    const imp: ActivityPubImport = {
      id: object.id || '',
      published: object.published || '',
      content: object.content || '',
      sensitive: !!object.sensitive,
      summary: object.summary || '',
      attachments: [],
      tags: [],
    };

    for (const attachment of object.attachment || []) {
      if (attachment?.type === 'Document' && attachment.url) {
        const attachmentPath = join(path, attachment.url);
        if (looksLikeSubmission(attachment.mediaType || 'unkown/unknown', attachmentPath)) {
          imp.attachments.push({
            path: attachmentPath,
            altText: attachment.name || '',
          });
        }
      }
    }
    if (imp.attachments.length === 0) {
      return null;
    }

    for (const tag of object.tag) {
      if (tag?.type === 'Hashtag' && tag.name) {
        imp.tags.push(tag.name.replace('#', ''));
      }
    }

    return imp;
  }

  private looksLikeDirectMessage({to, cc}: ActivityPubOutboxItem): boolean {
    for (const recipient of [...(to || []), ...(cc || [])]) {
      // If the post goes to the public or someone's followers, it's not a DM.
      if (/(#public|\/followers)$/i.test(recipient)) {
        return false;
      }
    }
    return true;
  }

  private async tryExtractImports(imports: ActivityPubImport[]): Promise<number> {
    let successes = 0;
    let current = 0;
    let lastProgress = null;
    for (const imp of imports) {
      try {
        await this.extractImport(imp);
        ++successes;
      } catch (err) {
        this.logger.error(`${imp.id}: ${err}`, null, 'Import Error');
        this.showImportError(`${imp.id}`);
      }
      ++current;
      lastProgress = this.showImportProgress(current, imports.length, lastProgress);
    }
    return successes;
  }

  private async extractImport(imp: ActivityPubImport): Promise<void> {
    const [firstAttachment, ...moreAttachments] = imp.attachments;
    const submission = await this.createSubmission(
      { path: firstAttachment.path },
      this.getDefaultPartData(imp),
    );
    this.logger.debug(submission._id, 'Imported Submission');

    for (const { path } of moreAttachments) {
      await this.service.submissionService.addFileSubmissionAdditionalFile(
        await this.readUploadedFile({ path }),
        submission._id,
        path,
      );
    }
  }

  private getDefaultPartData({
    published,
    content,
    sensitive,
    attachments,
    tags,
  }: ActivityPubImport): Promise<any> {
    const data: any = {};

    const descriptionParts = [];
    if (content) {
      descriptionParts.push(this.scrubHtmlDescription(content));
    }
    if (published) {
      descriptionParts.push(`<p>Originally posted on ${published.substring(0, 10)}.</p>`);
    }
    if (descriptionParts) {
      data.description = { overwriteDefault: false, value: descriptionParts.join('<p></p>') };
    }

    if (tags) {
      data.tags = { extendDefault: true, value: tags };
    }

    data.rating = sensitive ? SubmissionRating.ADULT : SubmissionRating.GENERAL;

    const altText = attachments[0].altText;
    if (altText) {
      data.altText = altText;
    }

    return data;
  }

  protected override scrubHtmlElement(elem: Element): Node | null {
    const name = elem.name.toLowerCase();
    const attribs = elem.attribs;
    const classes = (attribs['class'] || '').toLowerCase().trim().split(/\s+/);
    if (name === 'a' && classes.includes('hashtag')) {
      // Strip hashtags from the description, they're already in the tags field.
      return null;
    } else {
      return elem;
    }
  }
}
