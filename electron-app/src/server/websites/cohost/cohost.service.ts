import { Injectable } from '@nestjs/common';
import {
  DefaultOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  CohostFileOptions,
  CohostNotificationOptions,
  PostResponse,
  Submission,
  SubmissionPart,
  SubmissionRating,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server/account/models/user-account.entity';
import Http from 'src/server/http/http.util';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import FileSize from 'src/server/utils/filesize.util';
import FormContent from 'src/server/utils/form-content.util';
import WebsiteValidator from 'src/server/utils/website-validator.util';
import ImageManipulator from 'src/server/file-manipulation/manipulators/image.manipulator';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import _ from 'lodash';
import cheerio from 'cheerio';

@Injectable()
export class Cohost extends Website {
  BASE_URL: string = 'https://cohost.org';
  readonly MAX_CHARS: number = 5000;
  acceptsFiles: string[] = ['jpeg', 'jpg', 'jfif', 'png', 'pjpeg', 'pjp', 'gif', 'webp', 'svg', 'aac', 'm4a', 'm4b', 'flac', 'mp3', 'mpega', 'mp2', 'wav'];
  acceptsAdditionalFiles: boolean = true;
  maxUploadMB: number = 5;

  readonly usernameShortcuts = [
    {
      key: 'ch',
      url: 'https://cohost.org/$1',
    },
  ];

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(`${this.BASE_URL}/rc/user/settings`, data._id);
    
    if (res.body.includes('change password')) {
      status.loggedIn = true;
      const $ = cheerio.load(res.body);
      status.username = $('input[type=email]').attr('value');

      const pageName = $("*[id*=headlessui] img[alt]").attr("alt");
      this.storeAccountInformation(data._id, "pagename", pageName);
    }
    return status;
  }

  private isNSFW(rating: SubmissionRating): boolean {
    switch (rating) {
      case SubmissionRating.GENERAL:
        return false;
      case SubmissionRating.MATURE:
      case SubmissionRating.ADULT:
      case SubmissionRating.EXTREME:
        return true;
    }
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<CohostFileOptions>,
  ): Promise<PostResponse> {
    return this.makePost(cancellationToken, data);
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, CohostNotificationOptions>,
  ): Promise<PostResponse> {
    return this.makePost(cancellationToken, data);
  }

  async makePost(
    cancellationToken: CancellationToken,
    data: PostData<Submission, CohostFileOptions | CohostNotificationOptions>,
  ): Promise<PostResponse> {
    const pageName = encodeURIComponent(this.getAccountInfo(data.part.accountId, "pagename"));

    const res = await Http.get<string>(`${this.BASE_URL}/rc/user/settings`, data.part.accountId);
    this.verifyResponse(res);

    const postData: any = {
      postState: 0,
      headline: data.title,
      adultContent: this.isNSFW(data.rating),
      blocks: [],
      cws: [],
      tags: data.tags
    };

    if (data.spoilerText) {
      postData.cws.push(data.spoilerText);
    }

    this.checkCancelled(cancellationToken);

    // first create a draft
    const draft = await Http.post<{ postId: number }>(
      `${this.BASE_URL}/api/v1/project/${pageName}/posts`, data.part.accountId, {
        type: 'json',
        data: postData,
        requestOptions: {
          json: true,
        }
      },
    );
    
    this.verifyResponse(draft);

    // if we're posting images
    if ((data as FilePostData<CohostFileOptions>).primary) {
      const filePostData = (data as FilePostData<CohostFileOptions>);

      // upload attachments
      const arr = [filePostData.primary, ...filePostData.additional];
      for (let file of arr) {
        // start
        this.checkCancelled(cancellationToken);
        const attachment = await Http.post<{
          attachmentId: Number,
          url: string,
          requiredFields: Array<any>,
        }>(
          `${this.BASE_URL}/api/v1/project/${pageName}/posts/${draft.body.postId}/attach/start`, data.part.accountId, {
            type: 'json',
            data: {
              "filename": file.file.options.filename,
              "content_type": file.file.options.contentType,
              "content_length": file.file.value.byteLength
            },
            requestOptions: {
              json: true,
            }
          },
        );
    
        this.verifyResponse(attachment);
  
        // continue
        this.checkCancelled(cancellationToken);
        const upload = await Http.post(
          `${attachment.body.url}`, data.part.accountId, {
            type: 'multipart',
            data: {
              ...attachment.body.requiredFields,
              file: file.file
            }
          },
        );
    
        this.verifyResponse(upload);
  
        // finish
        this.checkCancelled(cancellationToken);
        const res = await Http.post<{
          attachmentId: string,
          url: string,
        }>(
          `${this.BASE_URL}/api/v1/project/${pageName}/posts/${draft.body.postId}/attach/finish/${attachment.body.attachmentId}`,
          data.part.accountId, {
            type: 'json',
            data: {},
            requestOptions: {
              json: true,
            }
          },
        );
    
        this.verifyResponse(res);
  
        postData.blocks.push({
            "type": "attachment", "attachment": {
              "fileURL": res.body.url,
              "attachmentId": res.body.attachmentId,
              "altText": file.altText
            }
        });
      }
    }

    // update the draft and publish
    postData.postState = 1;

    if (data.description) {
      postData.blocks.push({"type": "markdown", "markdown": {"content": data.description}});
    }

    this.checkCancelled(cancellationToken);
    const post = await Http.put<{ postId: number }>(
      `${this.BASE_URL}/api/v1/project/${pageName}/posts/${draft.body.postId}`, data.part.accountId, {
        type: 'json',
        data: postData,
        requestOptions: {
          json: true,
        }
      },
    );

    this.verifyResponse(post);

    if (!post.body.postId) {
      return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
    }
    return this.createPostResponse({ source: `${this.BASE_URL}/posts/${post.body.postId}` });
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(this.maxUploadMB) };
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<CohostFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    const description = FormContent.getDescription(defaultPart.data.description, submissionPart.data.description);

    if (description.length > this.MAX_CHARS) {
      problems.push(`Max description length allowed is 5000 characters.`);
    }

    const { type, size, name } = submission.primary;

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
    }

    if (FileSize.MBtoBytes(this.maxUploadMB) < size) {
      if (isAutoscaling &&
          type === FileSubmissionType.IMAGE &&
          ImageManipulator.isMimeType(submission.primary.mimetype)) {
        warnings.push(`${name} will be scaled down to ${this.maxUploadMB}MB.`);
      } else {
        problems.push(`Cohost's upload limit is ${this.maxUploadMB}MB.`);
      }
    }

    if (submission.additional?.length > 4) {
      problems.push(`Cohost only supports up to four attachments in a single post.`);
    }

    return { problems, warnings };
  }

  validateNotificationSubmission(
    submission: Submission,
    submissionPart: SubmissionPart<CohostNotificationOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];

    const description = FormContent.getDescription(defaultPart.data.description, submissionPart.data.description);

    if (!description) {
      problems.push('Description required');
    }

    if (description.length > this.MAX_CHARS) {
      problems.push(`Max description length allowed is 5000 characters.`);
    }

    return { problems, warnings };
  }
}
