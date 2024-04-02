// Copied from PB+ src (commons/src/enums/submission-rating.enum.ts)
export enum ESubmissionRating {
  GENERAL = 'general',
  MATURE = 'mature',
  ADULT = 'adult',
  EXTREME = 'extreme',
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace ESubmissionRating_Utils {
  /**
   * Get matching ESubmissionRating of given string (PB rating keys)
   * @param srVal String value to convert
   * @returns Matching ESubmissionRating
   * @throws RangeError when srVal is an invalid rating key
   */
  export function fromStringValue(srVal: string): ESubmissionRating | never {
    const srIdx = Object.values(ESubmissionRating).indexOf(srVal as ESubmissionRating);

    if (srIdx == -1) throw new RangeError(`Unknown submission rating: ${srVal}`);

    return ESubmissionRating[Object.keys(ESubmissionRating)[srIdx]];
  }
}

// Twitter's warning tags
export enum ESensitiveMediaWarnings {
  OTHER = 'other',
  GRAPHIC_VIOLENCE = 'graphic_violence',
  ADULT_CONTENT = 'adult_content',
}

export type ContentBlurType = 'other' | 'graphic_violence' | 'adult_content' | undefined;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ESensitiveMediaWarnings_Utils {
  export function getSMWFromContentBlur(contentBlur?: ContentBlurType) {
    switch (contentBlur) {
      case 'other':
        return ESensitiveMediaWarnings.OTHER;
      case 'adult_content':
        return ESensitiveMediaWarnings.ADULT_CONTENT;
      case 'graphic_violence':
        return ESensitiveMediaWarnings.GRAPHIC_VIOLENCE;
      default:
        return undefined;
    }
  }
}
