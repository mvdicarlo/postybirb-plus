export enum FileSubmissionType {
  IMAGE = 'IMAGE',
  TEXT = 'TEXT',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  UNKNOWN = 'UNKNOWN',
}

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
  'mp3',
  'pdf',
];

const AUDIO_TYPES: string[] = ['wav', 'wave', 'x-wav', 'x-pn-wav', 'audio'];

const VIDEO_TYPES: string[] = [
  'video',
  'avi',
  'flv',
  'm3u8',
  'mov',
  'wmv',
  'mpeg',
];

export function getSubmissionType(
  mime: string,
  filename: string,
): FileSubmissionType {
  const extension: string = filename
    .split('.')
    .pop()
    .toLowerCase();
  const mimeParts: string[] = mime.split('/');
  if (
    IMAGE_TYPES.includes(extension) ||
    IMAGE_TYPES.includes(mimeParts[0]) ||
    IMAGE_TYPES.includes(mimeParts[1])
  ) {
    return FileSubmissionType.IMAGE;
  }

  if (
    VIDEO_TYPES.includes(extension) ||
    VIDEO_TYPES.includes(mimeParts[0]) ||
    VIDEO_TYPES.includes(mimeParts[1])
  ) {
    return FileSubmissionType.VIDEO;
  }

  if (
    AUDIO_TYPES.includes(extension) ||
    AUDIO_TYPES.includes(mimeParts[0]) ||
    AUDIO_TYPES.includes(mimeParts[1])
  ) {
    return FileSubmissionType.AUDIO;
  }

  if (
    TEXT_TYPES.includes(extension) ||
    TEXT_TYPES.includes(mimeParts[0]) ||
    TEXT_TYPES.includes(mimeParts[1])
  ) {
    return FileSubmissionType.TEXT;
  }

  return FileSubmissionType.UNKNOWN;
}
