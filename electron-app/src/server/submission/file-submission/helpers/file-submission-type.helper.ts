import path from 'path';
import { FileSubmissionType } from 'postybirb-commons';

const IMAGE_TYPES: string[] = [
  'png',
  'jpeg',
  'jpg',
  'tiff',
  'gif',
  'svg',
  'webp',
  'ico',
  'bmp',
  'apng',
  'image',
];

const TEXT_TYPES: string[] = [
  'text',
  'txt',
  'rtf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'pdf',
  'odt',
  'md',
  'html',
];

const AUDIO_TYPES: string[] = ['wav', 'wave', 'x-wav', 'x-pn-wav', 'audio', 'odt', 'mp3'];

const VIDEO_TYPES: string[] = ['video', 'avi', 'flv', 'm3u8', 'mov', 'wmv', 'swf', 'webm'];

export function getSubmissionType(mime: string, filename: string): FileSubmissionType {
  const ext: string = path.parse(filename).ext.replace('.', '').toLowerCase();

  const mimeParts: string[] = mime.split('/');
  if (
    IMAGE_TYPES.includes(ext) ||
    IMAGE_TYPES.includes(mimeParts[0]) ||
    IMAGE_TYPES.includes(mimeParts[1])
  ) {
    return FileSubmissionType.IMAGE;
  }

  if (
    VIDEO_TYPES.includes(ext) ||
    VIDEO_TYPES.includes(mimeParts[0]) ||
    VIDEO_TYPES.includes(mimeParts[1])
  ) {
    return FileSubmissionType.VIDEO;
  }

  if (
    AUDIO_TYPES.includes(ext) ||
    AUDIO_TYPES.includes(mimeParts[0]) ||
    AUDIO_TYPES.includes(mimeParts[1])
  ) {
    return FileSubmissionType.AUDIO;
  }

  if (
    TEXT_TYPES.includes(ext) ||
    TEXT_TYPES.includes(mimeParts[0]) ||
    TEXT_TYPES.includes(mimeParts[1])
  ) {
    return FileSubmissionType.TEXT;
  }

  return FileSubmissionType.UNKNOWN;
}
