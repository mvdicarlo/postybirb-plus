import * as _ from 'lodash';
import * as fs from 'fs-extra';
import { DirectoryEntry, Importer } from './importer';
import { Element, Node, Text } from 'domhandler';
import { FileSubmissionType } from 'postybirb-commons';
import { Logger } from '@nestjs/common';
import { SubmissionImporterService } from '../submission-importer.service';
import { SubmissionRating } from 'postybirb-commons';
import { getSubmissionType } from '../../file-submission/helpers/file-submission-type.helper';
import { parse } from 'path';

interface FaArchiveImport {
  location: 'gallery' | 'scraps';
  id: number;
  jsonEntry: DirectoryEntry;
  fileEntry: DirectoryEntry;
  thumbnailEntry?: DirectoryEntry;
}

interface FaArchiveMetadata {
  type?: string;
  title?: string;
  date?: string;
  description?: string;
  tags?: string[];
  rating?: string;
}

function looksLikeSubmission(name: string): boolean {
  return getSubmissionType('unknown/unknown', name) !== FileSubmissionType.UNKNOWN;
}

function looksLikeThumbnail(name: string): boolean {
  return /^\.(gif|png|jpe?g)$/i.test(parse(name).ext);
}

// Imports dumps from https://github.com/askmeaboutlo0m/faescape
export class FaArchiveImporter extends Importer {
  private readonly logger = new Logger(FaArchiveImporter.name);

  constructor(service: SubmissionImporterService) {
    super(service);
  }

  override getName(): string {
    return FaArchiveImporter.name;
  }

  override getDisplayName(): string {
    return 'fa_archive dump';
  }

  override identify(tree: DirectoryEntry): boolean {
    let hasArchiveFile = false;
    let hasGalleryDir = false;
    let hasScrapsDir = false;
    for (const { type, name } of tree.entries) {
      if (name === 'archive.chunk' && type === 'file') {
        hasArchiveFile = true;
      } else if (name === 'gallery' && type === 'directory') {
        hasGalleryDir = true;
      } else if (name === 'scraps' && type === 'directory') {
        hasScrapsDir = true;
      }
    }
    return hasArchiveFile && hasGalleryDir && hasScrapsDir;
  }

  override async extract(tree: DirectoryEntry): Promise<number> {
    const imports: FaArchiveImport[] = [];
    for (const { name, type, entries } of tree.entries) {
      if ((name === 'gallery' || name === 'scraps') && type === 'directory') {
        imports.push(...this.collectImports(name, entries));
      }
    }

    const count = imports.length;
    this.tryExtractImports(imports).then((successes) => {
      this.logger.debug(`${successes}/${count} imported`, 'Imported Finished');
      this.showCompletedNotification(successes, count);
    });
    return count;
  }

  private collectImports(
    location: 'gallery' | 'scraps',
    entries: DirectoryEntry[],
  ): FaArchiveImport[] {
    const imports = new Map<number, Partial<FaArchiveImport>>();
    function importById(s: string): Partial<FaArchiveImport> {
      const id = Number.parseInt(s, 10);
      if (imports.has(id)) {
        return imports.get(id);
      } else {
        const imp = { location, id };
        imports.set(id, imp);
        return imp;
      }
    }

    for (const entry of entries) {
      if (entry.type === 'file') {
        const { name } = entry;
        const match = /^(?<id>[0-9]+)(?<type>[dft])\.(?<ext>.+)$/.exec(name);
        if (match) {
          const { id, type, ext } = match.groups;
          if (type === 'd' && ext === 'json') {
            importById(id).jsonEntry = entry;
          } else if (type === 'f' && looksLikeSubmission(name)) {
            importById(id).fileEntry = entry;
          } else if (type === 't' && looksLikeThumbnail(name)) {
            importById(id).thumbnailEntry = entry;
          }
        }
      }
    }

    return [...imports.values()].filter(
      ({ jsonEntry, fileEntry }) => jsonEntry && fileEntry,
    ) as FaArchiveImport[];
  }

  private async tryExtractImports(imports: FaArchiveImport[]): Promise<number> {
    let successes = 0;
    let current = 0;
    let lastProgress = null;
    for (const imp of _.sortBy(imports, ['id'])) {
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

  private async extractImport({
    location,
    jsonEntry,
    fileEntry,
    thumbnailEntry,
  }: FaArchiveImport): Promise<void> {
    const text = await fs.readFile(jsonEntry.path, 'utf-8');
    const metadata: FaArchiveMetadata = JSON.parse(text);
    const submission = await this.createSubmission(
      fileEntry,
      await this.getDefaultPartData(jsonEntry, metadata, location === 'scraps'),
      // FurAffinity image thumbnails are pretty useless, they're just badly
      // scaled versions of the original image. So don't import them, target
      // websites can generate a better thumbnail themselves.
      metadata.type === 'image' ? undefined : thumbnailEntry,
    );
    this.logger.debug(submission._id, 'Imported Submission');
  }

  private async getDefaultPartData(
    { path }: DirectoryEntry,
    { title, date, description, tags, rating }: FaArchiveMetadata,
    scraps: boolean,
  ): Promise<any> {
    const data: any = {};

    data.title = `${scraps ? 'Scrap: ' : ''}${title || parse(path).name}`;
    data.scraps = scraps;

    const descriptionParts = [];
    if (description) {
      descriptionParts.push(this.scrubHtmlDescription(description));
    }
    if (date) {
      descriptionParts.push(`<p>Originally posted on ${date.substring(0, 10)}.</p>`);
    }
    if (descriptionParts) {
      data.description = { overwriteDefault: false, value: descriptionParts.join('<p></p>') };
    }

    if (tags) {
      data.tags = { extendDefault: true, value: tags };
    }

    if (rating === 'General') {
      data.rating = SubmissionRating.GENERAL;
    } else if (rating === 'Mature') {
      data.rating = SubmissionRating.MATURE;
    } else if (rating === 'Adult') {
      data.rating = SubmissionRating.ADULT;
    }

    return data;
  }

  protected override scrubHtmlElement(elem: Element): Node | null {
    const name = elem.name.toLowerCase();
    const attribs = elem.attribs;
    const classes = (attribs['class'] || '').toLowerCase().trim().split(/\s+/);
    if (name === 'span' && classes.includes('parsed_nav_links')) {
      // Submission navigation links, for comics and stuff. This just doesn't
      // translate properly to any other website, but they usually have better
      // navigation capability than FA in the first place.
      return null;
    } else if (name === 'a' && classes.includes('auto_link_shortened')) {
      // Undo automatic link shortening, the target site can do its own thing.
      const { href } = attribs;
      return new Element('a', { href }, [new Text(href)]);
    } else if (
      name === 'a' &&
      (classes.includes('iconusername') || classes.includes('linkusername'))
    ) {
      // FurAffinity username references, converted over to shortcut syntax.
      const href = attribs.href.replace('/user/', '');
      return new Text(`{fa:${href}}`);
    } else {
      return elem;
    }
  }
}
