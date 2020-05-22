import { Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import UserAccountEntity from 'src/account/models/user-account.entity';
import Http from 'src/http/http.util';
import { SubmissionRating } from 'src/submission/enums/submission-rating.enum';
import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { CancellationToken } from 'src/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/submission/post/interfaces/post-data.interface';
import { PostResponse } from 'src/submission/post/interfaces/post-response.interface';
import { DefaultOptions } from 'src/submission/submission-part/interfaces/default-options.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import WebsiteValidator from 'src/utils/website-validator.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { Website } from '../website.base';
import { NewTumblBlog } from './new-tumbl-blog.interface';
import { NewTumblFileOptions, NewTumblNotificationOptions } from './new-tumbl.interface';
import {
  NewTumblDefaultFileOptions,
  NewTumblDefaultNotificationOptions,
} from './new-tumbl.defaults';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';

@Injectable()
export class NewTumbl extends Website {
  readonly BASE_URL = 'https://newtumbl.com';
  private readonly API_URL = 'https://api-rw.newtumbl.com/sp/NewTumbl'; // Assumed static?
  readonly acceptsFiles = ['jpeg', 'jpg', 'png', 'gif', 'mp4'];
  readonly acceptsAdditionalFiles = true;
  readonly usernameShortcuts = [{ key: 'nt', url: 'https://$1.newtumbl.com' }];
  readonly fileSubmissionOptions = NewTumblDefaultFileOptions;
  readonly notificationSubmissionOptions = NewTumblDefaultNotificationOptions;

  private async getLoginToken(partitionId: string): Promise<string | undefined> {
    const tokenCookie = (await Http.getWebsiteCookies(partitionId, this.BASE_URL))
      .filter(c => c.name === 'LoginToken')
      .shift();
    if (tokenCookie) {
      return tokenCookie.value;
    }
  }

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const loginToken = await this.getLoginToken(data._id);
    if (loginToken) {
      const res = await Http.post<{ nResult: string; aResultSet: any[] }>(
        `${this.API_URL}/get_User_Settings`,
        data._id,
        {
          type: 'form',
          requestOptions: { json: true },
          data: {
            json: JSON.stringify({
              Params: ['[{IPADDRESS}]', loginToken],
            }),
          },
        },
      );

      if (res.body.nResult === '0') {
        status.loggedIn = true;
        status.username = _.get(res.body, 'aResultSet[0].aRow[0].szEmailId', 'Unknown username');
        await this.getBlogs(data._id);
      }
    }

    return status;
  }

  private async getBlogs(profileId: string) {
    const blogs: NewTumblBlog[] = [];
    try {
      const page = await Http.get<string>(`${this.BASE_URL}/blogs`, profileId);
      const json = JSON.parse(
        page.body
          .match(/Data_Session.*?{(\s|.)*?;/g)[0]
          .replace(/Data_Session\s*=\s/g, '')
          .replace(';', ''),
      );
      const sets = json.aResultSet || [];
      for (let i = 0; i < sets.length; i++) {
        const set = sets[i];
        if (set.aRow.length) {
          for (let i = 0; i < set.aRow.length; i++) {
            const row = set.aRow[i];
            if (row.szBlogId) {
              blogs.push({
                name: row.szBlogId,
                id: row.dwBlogIx,
                primary: !!row.bPrimary,
              });
            }
          }
        }
      }
    } catch {}

    this.storeAccountInformation(profileId, 'blogs', blogs);
  }

  private getDefaultBlog(profileId: string): NewTumblBlog | undefined {
    return this.getAccountInfo(profileId, 'blogs')
      .filter(blog => blog.primary)
      .shift();
  }

  getScalingOptions(file: FileRecord) {
    return undefined;
  }

  private getRating(rating: SubmissionRating) {
    switch (rating) {
      case SubmissionRating.GENERAL:
        return '1';
      case SubmissionRating.MATURE:
        return '3';
      case SubmissionRating.ADULT:
        return '4';
      case SubmissionRating.EXTREME:
        return '5';
      default:
        rating; // has a chance of being another value outside of normal SubmissionRating
    }
  }

  parseDescription(text: string) {
    return text
      .replace(/<div/gm, '<p')
      .replace(/<\/div>/gm, '</p>')
      .replace(/<hr>/, '------------');
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, NewTumblNotificationOptions>,
  ): Promise<PostResponse> {
    const loginToken = await this.getLoginToken(data.part.accountId);
    const { options } = data;
    const blog = options.blog ? options.blog : this.getDefaultBlog(data.part.accountId).id;
    this.checkCancelled(cancellationToken);
    const compose = await Http.post<any>(`${this.API_URL}/set_Post_Compose`, data.part.accountId, {
      type: 'form',
      requestOptions: { json: true },
      data: {
        json: JSON.stringify({
          Params: ['[{IPADDRESS}]', loginToken, blog, 1],
        }),
      },
    });

    this.verifyResponse(compose, 'Compose');
    if (compose.body.nResult !== '0') {
      return Promise.reject(this.createPostResponse({ additionalInfo: compose.body }));
    }

    const postId: number = compose.body.aResultSet[0].aRow[0].qwPostIx;
    this.checkCancelled(cancellationToken);
    const getCompose = await Http.post<any>(
      `${this.API_URL}/get_Post_Compose`,
      data.part.accountId,
      {
        type: 'form',
        requestOptions: { json: true },
        data: {
          json: JSON.stringify({
            Params: ['[{IPADDRESS}]', loginToken, 0, postId],
          }),
        },
      },
    );

    this.verifyResponse(getCompose, 'Get compose');
    if (getCompose.body.nResult !== '0') {
      return Promise.reject(this.createPostResponse({ additionalInfo: getCompose.body }));
    }

    this.checkCancelled(cancellationToken);
    const postPart = await Http.post<any>(
      `${this.API_URL}/set_PostPart_Update`,
      data.part.accountId,
      {
        type: 'form',
        requestOptions: { json: true },
        data: {
          json: JSON.stringify({
            Params: [
              '[{IPADDRESS}]',
              loginToken,
              0,
              postId,
              0,
              data.description,
              `<p>${data.title}</p>`,
            ],
          }),
        },
      },
    );

    this.verifyResponse(postPart, 'Post Part');
    if (postPart.body.nResult !== '0') {
      return Promise.reject(this.createPostResponse({ additionalInfo: postPart.body }));
    }

    const rating = this.getRating(data.rating);
    const tags = data.tags.map(t => `#${t}`).join('');
    this.checkCancelled(cancellationToken);
    const postOptions = await Http.post<any>(
      `${this.API_URL}/set_Post_Options`,
      data.part.accountId,
      {
        type: 'form',
        requestOptions: { json: true },
        data: {
          json: JSON.stringify({
            Params: ['[{IPADDRESS}]', loginToken, 0, postId, 0, rating, '', '', tags],
          }),
        },
      },
    );

    this.verifyResponse(postOptions, 'Post Options');
    if (postOptions.body.nResult !== '0') {
      return Promise.reject(this.createPostResponse({ additionalInfo: postOptions.body }));
    }

    this.checkCancelled(cancellationToken);
    const postComplete = await Http.post<any>(
      `${this.API_URL}/set_Post_Complete`,
      data.part.accountId,
      {
        type: 'form',
        requestOptions: { json: true },
        data: {
          json: JSON.stringify({
            Params: ['[{IPADDRESS}]', loginToken, 0, postId],
          }),
        },
      },
    );

    this.verifyResponse(postComplete, 'Post');
    if (postComplete.body.nResult !== '0') {
      return Promise.reject(this.createPostResponse({ additionalInfo: postComplete.body }));
    }

    this.checkCancelled(cancellationToken);
    const publish = await Http.post<any>(`${this.API_URL}/set_Post_Publish`, data.part.accountId, {
      requestOptions: { json: true },
      data: {
        type: 'form',
        json: JSON.stringify({
          Params: ['[{IPADDRESS}]', loginToken, postId],
        }),
      },
    });

    this.verifyResponse(publish, 'Publish');
    if (publish.body.nResult !== '0') {
      return Promise.reject(this.createPostResponse({ additionalInfo: publish.body }));
    }

    return this.createPostResponse({});
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<NewTumblFileOptions>,
  ): Promise<PostResponse> {
    const loginToken = await this.getLoginToken(data.part.accountId);
    const postType = data.primary.type === FileSubmissionType.VIDEO ? 7 : 5;
    const { options } = data;
    const blog = options.blog ? options.blog : this.getDefaultBlog(data.part.accountId).id;
    this.checkCancelled(cancellationToken);
    const compose = await Http.post<any>(`${this.API_URL}/set_Post_Compose`, data.part.accountId, {
      type: 'form',
      requestOptions: { json: true },
      data: {
        json: JSON.stringify({
          Params: ['[{IPADDRESS}]', loginToken, blog, postType],
        }),
      },
    });

    this.verifyResponse(compose, 'Compose');
    if (compose.body.nResult !== '0') {
      return Promise.reject(this.createPostResponse({ additionalInfo: compose.body }));
    }

    const postId: number = compose.body.aResultSet[0].aRow[0].qwPostIx;
    this.checkCancelled(cancellationToken);
    const getCompose = await Http.post<any>(
      `${this.API_URL}/get_Post_Compose`,
      data.part.accountId,
      {
        type: 'form',
        requestOptions: { json: true },
        data: {
          json: JSON.stringify({
            Params: ['[{IPADDRESS}]', loginToken, 0, postId],
          }),
        },
      },
    );

    this.verifyResponse(getCompose, 'Get compose');
    if (getCompose.body.nResult !== '0') {
      return Promise.reject(this.createPostResponse({ additionalInfo: getCompose.body }));
    }

    const files = [data.primary.file, ...data.additional.map(f => f.file)];
    for (const f of files) {
      const upload = await Http.post<any>(
        `https://up0.newtumbl.com/sba/${loginToken}`,
        data.part.accountId,
        {
          requestOptions: { json: true },
          type: 'multipart',
          data: {
            image_file: f,
          },
        },
      );

      this.verifyResponse(upload, f.options.filename);
      if (upload.body.aResults[0].sError) {
        return Promise.reject(this.createPostResponse({ additionalInfo: upload.body }));
      }

      const id: number = upload.body.aResults[0].qwMediaIx || upload.body.aResults[0].qwPartIx;
      const insert = await Http.post<any>(
        `${this.API_URL}/set_PostPart_Insert`,
        data.part.accountId,
        {
          type: 'form',
          requestOptions: { json: true },
          data: {
            json: JSON.stringify({
              Params: ['[{IPADDRESS}]', loginToken, 0, postId, postType, '', '', id],
            }),
          },
        },
      );

      this.verifyResponse(insert, `Insert ${f.options.filename}`);
      if (insert.body.nResult !== '0') {
        return Promise.reject(this.createPostResponse({ additionalInfo: insert.body }));
      }
    }

    this.checkCancelled(cancellationToken);
    for (let i = 0; i < files.length; i++) {
      const update = await Http.post<any>(
        `${this.API_URL}/set_PostPart_Update`,
        data.part.accountId,
        {
          type: 'form',
          requestOptions: { json: true },
          data: {
            json: JSON.stringify({
              Params: ['[{IPADDRESS}]', loginToken, 0, postId, i + 1, '', ''],
            }),
          },
        },
      );

      this.verifyResponse(update, 'Update');
      if (update.body.nResult !== '0') {
        return Promise.reject(this.createPostResponse({ additionalInfo: update.body }));
      }
    }

    this.checkCancelled(cancellationToken);
    const postPart = await Http.post<any>(
      `${this.API_URL}/set_PostPart_Update`,
      data.part.accountId,
      {
        type: 'form',
        requestOptions: { json: true },
        data: {
          json: JSON.stringify({
            Params: [
              '[{IPADDRESS}]',
              loginToken,
              0,
              postId,
              0,
              data.description,
              `<p>${data.title}</p>`,
            ],
          }),
        },
      },
    );

    this.verifyResponse(postPart, 'Post Part');
    if (postPart.body.nResult !== '0') {
      return Promise.reject(this.createPostResponse({ additionalInfo: postPart.body }));
    }

    const rating = this.getRating(data.rating);
    const tags = data.tags.map(t => `#${t}`).join('');
    this.checkCancelled(cancellationToken);
    const postOptions = await Http.post<any>(
      `${this.API_URL}/set_Post_Options`,
      data.part.accountId,
      {
        type: 'form',
        requestOptions: { json: true },
        data: {
          json: JSON.stringify({
            Params: ['[{IPADDRESS}]', loginToken, 0, postId, 0, rating, '', '', tags],
          }),
        },
      },
    );

    this.verifyResponse(postOptions, 'Post Options');
    if (postOptions.body.nResult !== '0') {
      return Promise.reject(this.createPostResponse({ additionalInfo: postOptions.body }));
    }

    this.checkCancelled(cancellationToken);
    const postComplete = await Http.post<any>(
      `${this.API_URL}/set_Post_Complete`,
      data.part.accountId,
      {
        type: 'form',
        requestOptions: { json: true },
        data: {
          json: JSON.stringify({
            Params: ['[{IPADDRESS}]', loginToken, 0, postId],
          }),
        },
      },
    );

    this.verifyResponse(postComplete, 'Post');
    if (postComplete.body.nResult !== '0') {
      return Promise.reject(this.createPostResponse({ additionalInfo: postComplete.body }));
    }

    this.checkCancelled(cancellationToken);
    const publish = await Http.post<any>(`${this.API_URL}/set_Post_Publish`, data.part.accountId, {
      requestOptions: { json: true },
      data: {
        type: 'form',
        json: JSON.stringify({
          Params: ['[{IPADDRESS}]', loginToken, postId],
        }),
      },
    });

    this.verifyResponse(publish, 'Publish');
    if (publish.body.nResult !== '0') {
      return Promise.reject(this.createPostResponse({ additionalInfo: publish.body }));
    }

    return this.createPostResponse({});
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<NewTumblFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];

    if (submissionPart.data.blog) {
      const blogs: NewTumblBlog[] = this.getAccountInfo(submissionPart.accountId, 'blogs') || [];
      if (!blogs.find(b => b.id === submissionPart.data.blog)) {
        problems.push(`Blog (${submissionPart.data.blog}) not found.`);
      }
    } else {
      warnings.push('Default blog will be used');
    }

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        f => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    files.forEach(file => {
      const { name, mimetype } = file;
      if (!WebsiteValidator.supportsFileType(file, this.acceptsFiles)) {
        problems.push(`Does not support file format: (${name}) ${mimetype}.`);
      }
    });

    return { problems, warnings };
  }

  validateNotificationSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<NewTumblNotificationOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];

    if (submissionPart.data.blog) {
      const blogs: NewTumblBlog[] = this.getAccountInfo(submissionPart.accountId, 'blogs') || [];
      if (!blogs.find(b => b.id === submissionPart.data.blog)) {
        problems.push(`Blog (${submissionPart.data.blog}) not found.`);
      }
    } else {
      warnings.push('Default blog will be used');
    }

    return { problems, warnings };
  }
}
