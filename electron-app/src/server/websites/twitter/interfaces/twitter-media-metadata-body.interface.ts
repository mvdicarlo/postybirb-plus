import {
    ESensitiveMediaWarnings
} from '../enums/twitter-sensitive-media-warnings.enum';

// An undocumented part of Twitter's 1.1 API, yaaaay
export interface ImediaMetadataBody {
    alt_text?: {text: string}
    media_id: string
    sensitive_media_warning?: [ESensitiveMediaWarnings]
}