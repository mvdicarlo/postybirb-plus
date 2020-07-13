import { Injectable } from '@nestjs/common';
import UserAccountEntity from 'src/account/models/user-account.entity';
import { UsernameParser } from 'src/description-parsing/miscellaneous/username.parser';
import ImageManipulator from 'src/file-manipulation/manipulators/image.manipulator';
import Http, {HttpResponse} from 'src/http/http.util';
import { SubmissionRating } from 'src/submission/enums/submission-rating.enum';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';
import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { CancellationToken } from 'src/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/submission/post/interfaces/file-post-data.interface';
import { PostResponse } from 'src/submission/post/interfaces/post-response.interface';
import { DefaultOptions } from 'src/submission/submission-part/interfaces/default-options.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/utils/filesize.util';
import WebsiteValidator from 'src/utils/website-validator.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { UsernameShortcut } from '../interfaces/username-shortcut.interface';
import { Website } from '../website.base';
import { ArtconomyAccountData } from './artconomy-account.interface';
import { ArtconomyDefaultFileOptions } from './artconomy.defaults';
import { ArtconomyOptions } from './artconomy.interface';
import {MarkdownParser} from "src/description-parsing/markdown/markdown.parser";


@Injectable()
export class Artconomy extends Website {
  readonly BASE_URL: string = 'https://artconomy.com';
  readonly acceptsFiles: string[] = [
    'png',
    'jpeg',
    'jpg',
    'gif',
    'mp4',
    'doc',
    'rtf',
    'txt',
    'mp3',
  ];
  readonly defaultDescriptionParser = MarkdownParser.parse;
  readonly fileSubmissionOptions: object = ArtconomyDefaultFileOptions;
  usernameShortcuts: UsernameShortcut[] = [
    {
      key: 'ac',
      url: 'https://artconomy/$1',
    },
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null};
    if (!data.data && data.data.authtoken) {
      return status
    }
    const authCheck = await Http.get<any>(`${this.BASE_URL}/api/profiles/v1/data/requester/`, data._id, {
      requestOptions: { json: true, headers: {Authorization: `Token ${data.data.authtoken}`} },
    });
    if (authCheck.response.statusCode === 200 && authCheck.response.body.username !== '_') {
      status.username = authCheck.response.body.username;
      status.loggedIn = true;
    }
    return status;
  }

  transformAccountData(data: ArtconomyAccountData) {
    return { username: data.username, id: data.id, csrftoken: data.csrftoken, authtoken: data.authtoken };
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
        return 0;
      case SubmissionRating.MATURE:
        return 1;
      case SubmissionRating.ADULT:
        return 2
      case SubmissionRating.EXTREME:
        return 3
      default:
        // Safest assumption.
        return 2
    }
  }

  checkAssetUpload(upload: HttpResponse<{id: string}>) {
    if (!(upload.body.id)) {
      return Promise.reject(
          this.createPostResponse({
            message: upload.response.statusMessage,
            additionalInfo: JSON.stringify(upload.body),
          }),
      );
    }
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<ArtconomyOptions>,
    accountData: ArtconomyAccountData,
  ): Promise<PostResponse> {
    const primaryAssetForm: any = {
      'files[]': data.primary.file,
    };

    const thumbnailAssetForm = {
      'files[]': data.thumbnail,
    }
    const requestOptions = { json: true, headers: {Authorization: `Token ${accountData.authtoken}`}};
    this.checkCancelled(cancellationToken);
    let upload = await Http.post<{ id: string }>(
      `${this.BASE_URL}/api/lib/v1/asset/`,
      undefined,
      {
        requestOptions,
        type: 'multipart',
        skipCookies: true,
        data: primaryAssetForm,
      },
    );
    let check = this.checkAssetUpload(upload)
    if (check) {
      return check
    }

    const primaryAsset = upload.body.id;
    let thumbnailAsset: null|string = null
    if (data.thumbnail) {
      upload = await Http.post<{ id: string }>(
          `${this.BASE_URL}/api/lib/v1/asset/`,
          undefined,
          {
            requestOptions,
            type: 'multipart',
            skipCookies: true,
            data: thumbnailAssetForm,
          },
      );
      check = this.checkAssetUpload(upload)
      if (check) {
        return check
      }
      thumbnailAsset = upload.body.id;
    }

    const editForm: any = {
      file: primaryAsset,
      preview: thumbnailAsset,
      title: data.title,
      caption: data.description,
      tags: this.formatTags(data.tags),
      rating: this.getRating(data.rating),
      private: data.options.private,
      comments_disabled: data.options.comments_disabled,
      artists: [],
    };
    if (data.options.is_artist) {
      editForm.artists.push(accountData.id)
    }

    this.checkCancelled(cancellationToken);
    const post = await Http.post<any>(`${this.BASE_URL}/api/profiles/v1/account/${accountData.username}/submissions/`, undefined, {
      type: 'json',
      data: {},
      requestOptions,
      skipCookies: true,
    })
    check = this.checkAssetUpload(post)
    if (check) {
      return check
    }
    return this.createPostResponse({ source: `${this.BASE_URL}/submissions/${post.body.id}` });
  }

  parseTags(tags: string[]) {
    return tags.map(tag => {
      return tag
        .trim()
        .replace(/\s/gm, '_')
    });
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<ArtconomyOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        f => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    const maxMB: number = 99;
    files.forEach(file => {
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
          problems.push(`Artconomy limits ${mimetype} to ${maxMB}MB`);
        }
      }
    });

    return { problems, warnings };
  }
}
