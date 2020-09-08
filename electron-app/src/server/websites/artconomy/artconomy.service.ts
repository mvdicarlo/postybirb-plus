import { Injectable } from '@nestjs/common';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http, { HttpResponse } from 'src/server/http/http.util';
import { SubmissionRating } from 'postybirb-commons';
import { FileSubmissionType } from 'postybirb-commons';
import { FileRecord } from 'src/server/submission/file-submission/interfaces/file-record.interface';
import { FileSubmission } from 'src/server/submission/file-submission/interfaces/file-submission.interface';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostResponse } from 'src/server/submission/post/interfaces/post-response.interface';
import { DefaultOptions } from 'src/server/submission/submission-part/interfaces/default-options.interface';
import { SubmissionPart } from 'src/server/submission/submission-part/interfaces/submission-part.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { UsernameShortcut } from '../interfaces/username-shortcut.interface';
import { Website } from '../website.base';
import { ArtconomyDefaultFileOptions } from './artconomy.defaults';
import { ArtconomyFileOptions } from './artconomy.interface';
import { MarkdownParser } from 'src/server/description-parsing/markdown/markdown.parser';

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
      url: 'https://artconomy.com/$1',
    },
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const authCheck = await Http.get<any>(
      `${this.BASE_URL}/api/profiles/v1/data/requester/`,
      data._id,
      {
        requestOptions: {
          json: true,
        },
      },
    );
    if (authCheck.response.statusCode === 200 && authCheck.response.body.username !== '_') {
      this.storeAccountInformation(data._id, 'id', authCheck.response.body.id);
      this.storeAccountInformation(data._id, 'username', authCheck.response.body.username);
      this.storeAccountInformation(data._id, 'authToken', authCheck.response.body.authtoken);
      this.storeAccountInformation(data._id, 'csrfToken', authCheck.response.body.csrftoken);
      status.username = authCheck.response.body.username;
      status.loggedIn = true;
    }
    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions | undefined {
    return { maxSize: FileSize.MBtoBytes(200) };
  }

  private getRating(rating: SubmissionRating | string) {
    switch (rating) {
      case SubmissionRating.GENERAL:
        return 0;
      case SubmissionRating.MATURE:
        return 1;
      case SubmissionRating.ADULT:
        return 2;
      case SubmissionRating.EXTREME:
        return 3;
      default:
        // Safest assumption.
        return 2;
    }
  }

  async checkAssetUpload(upload: HttpResponse<{ id: string }>) {
    if (!upload.body.id) {
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
    data: FilePostData<ArtconomyFileOptions>,
  ): Promise<PostResponse> {
    const primaryAssetForm: any = {
      'files[]': data.primary.file,
    };
    const id = this.getAccountInfo(data.part.accountId, 'id');
    const username = this.getAccountInfo(data.part.accountId, 'username');
    const authToken = this.getAccountInfo(data.part.accountId, 'authToken');
    const csrfToken = this.getAccountInfo(data.part.accountId, 'csrfToken');

    const thumbnailAssetForm = {
      'files[]': data.thumbnail,
    };
    const requestOptions = {
      json: true,
      headers: {
        Authorization: `Token ${authToken}`,
        'X-CSRFToken': `${csrfToken}`,
      },
    };
    this.checkCancelled(cancellationToken);
    let upload = await Http.post<{ id: string }>(`${this.BASE_URL}/api/lib/v1/asset/`, undefined, {
      requestOptions,
      type: 'multipart',
      skipCookies: true,
      data: primaryAssetForm,
    });
    await this.checkAssetUpload(upload);

    const primaryAsset = upload.body.id;
    let thumbnailAsset: null | string = null;
    if (data.thumbnail) {
      upload = await Http.post<{ id: string }>(`${this.BASE_URL}/api/lib/v1/asset/`, undefined, {
        requestOptions,
        type: 'multipart',
        skipCookies: true,
        data: thumbnailAssetForm,
      });
      await this.checkAssetUpload(upload);
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
      comments_disabled: data.options.commentsDisabled,
      artists: [],
    };
    if (data.options.isArtist) {
      editForm.artists.push(id);
    }

    this.checkCancelled(cancellationToken);
    const post = await Http.post<any>(
      `${this.BASE_URL}/api/profiles/v1/account/${username}/submissions/`,
      undefined,
      {
        type: 'json',
        data: editForm,
        requestOptions,
        skipCookies: true,
      },
    );
    await this.checkAssetUpload(post);
    return this.createPostResponse({ source: `${this.BASE_URL}/submissions/${post.body.id}` });
  }

  parseTags(tags: string[]) {
    return tags.map(tag => {
      return tag.trim().replace(/\s/gm, '_');
    });
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<ArtconomyFileOptions>,
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
