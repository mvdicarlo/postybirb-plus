import { Injectable } from '@nestjs/common';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  InkbunnyFileOptions,
  PostResponse,
  SubmissionPart,
  SubmissionRating,
  UsernameShortcut,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { BBCodeParser } from 'src/server/description-parsing/bbcode/bbcode.parser';
import { UsernameParser } from 'src/server/description-parsing/miscellaneous/username.parser';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import FormContent from 'src/server/utils/form-content.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import { InkbunnyAccountData } from './inkbunny-account.interface';

@Injectable()
export class Inkbunny extends Website {
  readonly BASE_URL: string = 'https://inkbunny.net';
  readonly acceptsFiles: string[] = [
    'png',
    'jpeg',
    'jpg',
    'gif',
    'swf',
    'flv',
    'mp4',
    'doc',
    'rtf',
    'txt',
    'mp3',
  ];
  readonly acceptsAdditionalFiles: boolean = true;
  readonly defaultDescriptionParser = BBCodeParser.parse;
  usernameShortcuts: UsernameShortcut[] = [
    {
      key: 'ib',
      url: 'https://inkbunny.net/$1',
    },
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const accountData: InkbunnyAccountData = data.data;
    if (accountData && accountData.username && accountData.sid) {
      const authCheck = await Http.post<any>(`${this.BASE_URL}/api_watchlist.php`, data._id, {
        type: 'multipart',
        requestOptions: { json: true },
        data: {
          sid: accountData.sid,
          limit: 5,
        },
      });
      if (!authCheck.body?.error_code) {
        status.username = accountData.username;
        status.loggedIn = true;
      }

      // Debugging for a user
      if (!authCheck.body) {
        this.logger.log(
          `Inkbunny returned empty body: ${authCheck.response.statusCode}: ${authCheck.response.statusMessage} - ${authCheck.error}`,
        );
      }
    }

    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions | undefined {
    return { maxSize: FileSize.MBtoBytes(200) };
  }

  preparseDescription(text: string) {
    text = UsernameParser.replaceText(text, 'fa', '[fa]$1[/fa]');
    text = UsernameParser.replaceText(text, 'sf', '[sf]$1[/sf]');
    text = UsernameParser.replaceText(text, 'da', '[da]$1[/da]');
    text = UsernameParser.replaceText(text, 'ws', '[w]$1[/w]');
    text = UsernameParser.replaceText(text, 'ib', '[iconname]$1[/iconname]');
    return text;
  }

  parseDescription(text: string) {
    text = super.parseDescription(text);
    return text.replace(/\[hr\]/g, '-----');
  }

  private getRating(rating: SubmissionRating | string) {
    switch (rating) {
      case SubmissionRating.GENERAL:
        return '0';
      case SubmissionRating.MATURE:
        return '2';
      case SubmissionRating.ADULT:
      case SubmissionRating.EXTREME:
        return '4';
      default:
        return rating; // potential custom value
    }
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<InkbunnyFileOptions>,
    accountData: InkbunnyAccountData,
  ): Promise<PostResponse> {
    const form: any = {
      sid: accountData.sid,
      'uploadedfile[0]': data.primary.file,
    };

    if (data.thumbnail) {
      form['uploadedthumbnail[]'] = data.thumbnail;
    }

    data.additional.forEach((file, index) => {
      form[`uploadedfile[${index + 1}]`] = file.file;
    });

    this.checkCancelled(cancellationToken);
    const upload = await Http.post<{ sid: string; submission_id: string; error_code: any }>(
      `${this.BASE_URL}/api_upload.php`,
      undefined,
      {
        skipCookies: true,
        requestOptions: { json: true },
        type: 'multipart',
        data: form,
      },
    );

    if (!upload?.body?.sid) {
      return Promise.reject(
        this.createPostResponse({
          message: upload?.body?.error_code ?? upload?.body,
          additionalInfo: JSON.stringify(upload.body),
        }),
      );
    }

    const editForm: any = {
      sid: accountData.sid,
      submission_id: upload.body.submission_id,
      title: data.title,
      desc: data.description,
      keywords: this.formatTags(data.tags),
    };

    const ratings = this.getRating(data.rating);
    if (ratings !== '0') {
      // when not general
      for(const rating of ratings.split(',')) {
        editForm[`tag[${rating}]`] = 'yes';
      }
    }

    const { options } = data;
    if (options.submissionType) {
      editForm.type = options.submissionType;
    }
    if (options.scraps) {
      editForm.scraps = 'yes';
    }
    if (!options.notify) {
      editForm.visibility = 'yes_nowatch';
    } else {
      editForm.visibility = 'yes';
    }

    if (options.blockGuests) {
      editForm.guest_block = 'yes';
    }
    if (options.friendsOnly) {
      editForm.friends_only = 'yes';
    }

    this.checkCancelled(cancellationToken);
    const post = await Http.post<any>(`${this.BASE_URL}/api_editsubmission.php`, undefined, {
      type: 'multipart',
      data: editForm,
      skipCookies: true,
    });

    let json: { error_code: any; submission_id: any } = null;
    try {
      json = JSON.parse(post.body);
    } catch (err) {
      return Promise.reject({ message: post.body, additionalInfo: post.body });
    }

    if (!json.submission_id || json.error_code !== undefined) {
      return Promise.reject(
        this.createPostResponse({
          message: json.error_code,
          additionalInfo: json.error_code,
        }),
      );
    }

    return this.createPostResponse({ source: `${this.BASE_URL}/s/${json.submission_id}` });
  }

  parseTags(tags: string[]) {
    return tags.map((tag) => {
      return tag.trim().replace(/\s/gm, '_').replace(/\\/gm, '/');
    });
  }

  formatTags(tags: string[]) {
    return super.formatTags(tags).join(',').trim();
  }

  transformAccountData(data: InkbunnyAccountData) {
    return { username: data.username };
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<InkbunnyFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    if (FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 4) {
      problems.push('Requires at least 4 tags.');
    }

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        (f) => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    const maxMB: number = 200;
    files.forEach((file) => {
      const { type, size, name, mimetype } = file;
      if (!WebsiteValidator.supportsFileType(file, this.acceptsFiles)) {
        problems.push(`Does not support file format: (${name}) ${mimetype}.`);
      }

      if (FileSize.MBtoBytes(maxMB) < size) {
        if (
          isAutoscaling &&
          type === FileSubmissionType.IMAGE &&
          ImageManipulator.isMimeType(mimetype)
        ) {
          warnings.push(`${name} will be scaled down to ${maxMB}MB`);
        } else {
          problems.push(`Inkbunny limits ${mimetype} to ${maxMB}MB`);
        }
      }
    });

    return { problems, warnings };
  }
}
