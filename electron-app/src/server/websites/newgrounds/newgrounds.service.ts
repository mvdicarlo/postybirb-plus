import { Injectable } from '@nestjs/common';
import cheerio from 'cheerio';
import { nativeImage } from 'electron';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  NewgroundsFileOptions,
  PostResponse,
  Submission,
  SubmissionPart,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { GifManipulator } from 'src/server/file-manipulation/manipulators/gif.manipulator';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import {
  FilePostData,
  PostFile,
} from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import HtmlParserUtil from 'src/server/utils/html-parser.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import { v1 } from 'uuid';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import BrowserWindowUtil from 'src/server/utils/browser-window.util';

type NewgroundsPostResponse = {
  edit_url: string;
  can_publish: boolean;
  project_id: number;
  success: string;
};

@Injectable()
export class Newgrounds extends Website {
  readonly BASE_URL: string = 'https://www.newgrounds.com';
  readonly acceptsFiles = ['jpeg', 'jpg', 'png', 'gif', 'bmp'];
  readonly MAX_CHARS: number = undefined; // No Limit
  readonly usernameShortcuts = [
    {
      key: 'ng',
      url: 'https://$1.newgrounds.com',
    },
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(this.BASE_URL, data._id, {
      requestOptions: { rejectUnauthorized: false },
    });
    if (res.body.includes('activeuser')) {
      status.loggedIn = true;
      status.username = res.body.match(/"name":"(.*?)"/)[1];
    }
    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(40) };
  }

  parseDescription(text: string) {
    return text.replace(/<div/gm, '<p').replace(/<\/div>/gm, '</p>');
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, DefaultOptions>,
  ): Promise<PostResponse> {
    const page = await Http.get<string>(`${this.BASE_URL}/account/news/post`, data.part.accountId, {
      requestOptions: { rejectUnauthorized: false },
    });
    this.verifyResponse(page);

    this.checkCancelled(cancellationToken);
    const post = await Http.post<string>(
      `${this.BASE_URL}/account/news/post`,
      data.part.accountId,
      {
        type: 'multipart',
        data: {
          post_id: '',
          userkey: HtmlParserUtil.getInputValue(page.body, 'userkey'),
          subject: data.title,
          emoticon: '6',
          comments_pref: '1',
          tag: '',
          'tags[]': this.formatTags(data.tags),
          body: `<p>${data.description}</p>`,
        },
        requestOptions: {
          qsStringifyOptions: { arrayFormat: 'repeat' },
          rejectUnauthorized: false,
        },
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Origin: 'https://www.newgrounds.com',
          Referer: `https://www.newgrounds.com/account/news/post`,
          'Accept-Encoding': 'gzip, deflate, br',
          Accept: '*',
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    this.verifyResponse(post);
    try {
      const json: { url: string } = JSON.parse(post.body);
      if (json.url) {
        return this.createPostResponse({ source: json.url });
      }
    } catch {}

    return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
  }

  private async getThumbnail(
    thumbnail: PostFile | undefined,
    primary: PostFile,
  ): Promise<PostFile> {
    let thumbfile: PostFile = {
      value: thumbnail?.value ?? primary.value,
      options: {
        filename: 'thumbnail.png',
        contentType: 'image/png',
      },
    };
    if (!thumbnail && primary.options.contentType === 'image/gif') {
      const frame0 = await GifManipulator.getFrame(primary.value);
      thumbfile.value = frame0;
    }

    const scalePx = 600;
    let thumb = nativeImage.createFromBuffer(thumbfile.value);
    let { height, width } = thumb.getSize();
    const ar = thumb.getAspectRatio();
    if (ar >= 1) {
      if (width > scalePx) {
        thumb = thumb.resize({
          width: scalePx,
          height: Math.floor(scalePx / ar),
        });
        width = scalePx;
        height = Math.floor(scalePx / ar);
      }
    } else {
      if (height > scalePx) {
        thumb = thumb.resize({
          width: Math.floor(scalePx * ar),
          height: scalePx,
        });
        width = Math.floor(scalePx * ar);
        height = scalePx;
      }
    }

    thumbfile.value = thumb.toPNG();
    return thumbfile;
  }

  private checkIsSaved(response: NewgroundsPostResponse): boolean {
    return response.success === 'saved';
  }

  private cleanUpFailedProject(partition: string, project_id: number, userKey: string) {
    return Http.post(`${this.BASE_URL}/projects/art/remove/${project_id}`, partition, {
      type: 'multipart',
      data: {
        userkey: userKey,
      },
    });
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<NewgroundsFileOptions>,
  ): Promise<PostResponse> {
    const userKey: string = await BrowserWindowUtil.runScriptOnPage(
      data.part.accountId,
      `${this.BASE_URL}/projects/art/new`,
      'return PHP.get("uek")',
      300,
    );
    if (!userKey) {
      return Promise.reject(this.createPostResponse({ message: 'Could not get userkey' }));
    }

    this.checkCancelled(cancellationToken);
    const initRes = await Http.post<NewgroundsPostResponse>(
      `${this.BASE_URL}/projects/art/new`,
      data.part.accountId,
      {
        type: 'multipart',
        requestOptions: { json: true },
        data: {
          PHP_SESSION_UPLOAD_PROGRESS: 'projectform',
          init_project: '1',
          userkey: userKey,
        },
      },
    );

    if (!initRes.body.project_id || !this.checkIsSaved(initRes.body)) {
      return Promise.reject(
        this.createPostResponse({
          message: 'Could not initialize post to Newgrounds',
          additionalInfo: initRes.body,
        }),
      );
    }

    const { edit_url, project_id } = initRes.body;
    const thumbfile = await this.getThumbnail(data.thumbnail, data.primary.file);
    const primaryBuf = nativeImage.createFromBuffer(data.primary.file.value);
    const size = primaryBuf.getSize();
    const fileUploadRes = await Http.post<
      NewgroundsPostResponse & {
        linked_icon: number;
        image: Record<string, unknown>;
      }
    >(edit_url, data.part.accountId, {
      type: 'multipart',
      data: {
        userkey: userKey,
        width: size.width,
        height: size.height,
        new_image: data.primary.file,
        link_icon: '1',
        cropdata: `{"x":0,"y":45,"width":${size.width},"height":${size.height}}`,
        thumbnail: thumbfile,
      },
      requestOptions: { json: true },
    });

    if (!fileUploadRes.body.image || !this.checkIsSaved(initRes.body)) {
      this.cleanUpFailedProject(data.part.accountId, initRes.body.project_id, userKey);
      return Promise.reject(
        this.createPostResponse({
          message: 'Could not upload file to Newgrounds',
          additionalInfo: fileUploadRes.body,
        }),
      );
    }

    const { linked_icon } = fileUploadRes.body;
    const linkImageRes = await Http.post<NewgroundsPostResponse>(edit_url, data.part.accountId, {
      type: 'multipart',
      data: {
        userkey: userKey,
        art_image_sort: `[${linked_icon}]`,
      },
      requestOptions: { json: true },
    });

    if (!this.checkIsSaved(linkImageRes.body)) {
      this.cleanUpFailedProject(data.part.accountId, initRes.body.project_id, userKey);
      return Promise.reject(
        this.createPostResponse({
          message: 'Could not upload file to Newgrounds',
          additionalInfo: linkImageRes.body,
        }),
      );
    }

    const { options } = data;
    const contentUpdateRes = await Http.post<NewgroundsPostResponse>(
      edit_url,
      data.part.accountId,
      {
        type: 'multipart',
        requestOptions: { json: true },
        data: {
          PHP_SESSION_UPLOAD_PROGRESS: 'projectform',
          userkey: userKey,
          encoder: 'quill',
          title: data.title,
          'option[longdescription]': this.parseDescription(data.description),
          'option[tags]': this.formatTags(data.tags).join(','),
          'option[include_in_portal]': options.sketch ? '0' : '1',
          'option[use_creative_commons]': options.creativeCommons ? '1' : '0',
          'option[cc_commercial]': options.commercial ? 'yes' : 'no',
          'option[cc_modifiable]': options.modification ? 'yes' : 'no',
          'option[genreid]': options.category,
          'option[nudity]': options.nudity,
          'option[violence]': options.violence,
          'option[language_textual]': options.explicitText,
          'option[adult_themes]': options.adultThemes,
        },
      },
    );

    if (!this.checkIsSaved(contentUpdateRes.body)) {
      this.cleanUpFailedProject(data.part.accountId, initRes.body.project_id, userKey);
      return Promise.reject(
        this.createPostResponse({
          message: 'Could not update content',
          additionalInfo: contentUpdateRes.body,
        }),
      );
    }

    const resKeys = Object.entries(contentUpdateRes.body).filter(([key]) => key.endsWith('_error'));
    if (resKeys.length > 0) {
      this.cleanUpFailedProject(data.part.accountId, initRes.body.project_id, userKey);
      return Promise.reject(
        this.createPostResponse({
          message: 'Could not update content:\n' + resKeys.map(([_, value]) => value).join('\n'),
          additionalInfo: contentUpdateRes.body,
        }),
      );
    }

    this.checkCancelled(cancellationToken);
    if (contentUpdateRes.body.can_publish) {
      const publishRes = await Http.post<unknown>(
        `${this.BASE_URL}/projects/art/${project_id}/publish`,
        data.part.accountId,
        {
          type: 'multipart',
          data: {
            userkey: userKey,
            submit: '1',
            agree: 'Y',
            __ng_design: '2015',
          },
        },
      );

      try {
        this.verifyResponse(publishRes);
        return this.createPostResponse({ source: publishRes.returnUrl });
      } catch (err) {
        this.cleanUpFailedProject(data.part.accountId, initRes.body.project_id, userKey);
        return Promise.reject(err);
      }
    } else {
      this.cleanUpFailedProject(data.part.accountId, initRes.body.project_id, userKey);
      return Promise.reject(
        this.createPostResponse({
          message: 'Could not publish content. It may be missing data',
          additionalInfo: contentUpdateRes.body,
        }),
      );
    }
  }

  formatTags(tags: string[]): string[] {
    return super
      .formatTags(tags, { spaceReplacer: '-' })
      .map(tag => {
        return tag.replace(/(\(|\)|:|#|;|\]|\[|')/g, '').replace(/_/g, '-');
      })
      .slice(0, 12);
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<NewgroundsFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
    description: string,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    if (!submissionPart.data.category) {
      problems.push('Must select a category value.');
    }

    if (!submissionPart.data.nudity) {
      problems.push('Must select a Nudity value.');
    }

    if (!submissionPart.data.violence) {
      problems.push('Must select a Violence value.');
    }

    if (!submissionPart.data.explicitText) {
      problems.push('Must select an Explicit Text value.');
    }

    if (!submissionPart.data.adultThemes) {
      problems.push('Must select an Adult Themes value.');
    }

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
    }

    const { type, size, name } = submission.primary;
    let maxMB: number = 40;
    if (FileSize.MBtoBytes(maxMB) < size) {
      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        ImageManipulator.isMimeType(submission.primary.mimetype)
      ) {
        warnings.push(`${name} will be scaled down to ${maxMB}MB`);
      } else {
        problems.push(`Newgrounds limits ${submission.primary.mimetype} to ${maxMB}MB`);
      }
    }

    return { problems, warnings };
  }
}
