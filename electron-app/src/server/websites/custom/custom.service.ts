import { Injectable } from '@nestjs/common';
import { Website } from '../website.base';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { LoginResponse } from '../interfaces/login-response.interface';
import { CustomAccountData } from './custom-account.interface';
import { FileRecord } from 'src/server/submission/file-submission/interfaces/file-record.interface';
import {
  DefaultFileOptions,
  DefaultOptions,
} from 'src/server/submission/submission-part/interfaces/default-options.interface';
import { FileSubmission } from 'src/server/submission/file-submission/interfaces/file-submission.interface';
import { SubmissionPart } from 'src/server/submission/submission-part/interfaces/submission-part.interface';
import { ValidationParts } from 'src/server/submission/validator/interfaces/validation-parts.interface';
import { BBCodeParser } from 'src/server/description-parsing/bbcode/bbcode.parser';
import HtmlParser from 'src/server/description-parsing/html-node/parser';
import { MarkdownParser } from 'src/server/description-parsing/markdown/markdown.parser';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
import { CancellationToken } from 'src/server/submission/post/cancellation/cancellation-token';
import { PostData } from 'src/server/submission/post/interfaces/post-data.interface';
import { Submission } from 'src/server/submission/interfaces/submission.interface';
import { PostResponse } from 'src/server/submission/post/interfaces/post-response.interface';
import Http from 'src/server/http/http.util';
import { FilePostData } from 'src/server/submission/post/interfaces/file-post-data.interface';
import {
  GenericDefaultFileOptions,
  GenericDefaultNotificationOptions,
} from '../generic/generic.defaults';

@Injectable()
export class Custom extends Website {
  readonly BASE_URL: string = '';
  readonly acceptsFiles: string[] = []; // accepts all
  readonly fileSubmissionOptions = GenericDefaultFileOptions;
  readonly notificationSubmissionOptions = GenericDefaultNotificationOptions;

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };

    if (data.data) {
      const webhookData: CustomAccountData = data.data;
      if (webhookData.fileUrl || webhookData.notificationUrl) {
        status.loggedIn = true;
        status.username = webhookData.fileUrl || webhookData.notificationUrl;
        if (webhookData.descriptionField && webhookData.descriptionType) {
          this.storeAccountInformation(
            data._id,
            'parser',
            this.getDescriptionParser(webhookData.descriptionType),
          );
        }
      }
    }

    return status;
  }

  private getDescriptionParser(type: 'html' | 'md' | 'text' | 'bbcode') {
    switch (type) {
      case 'bbcode':
        return BBCodeParser.parse;
      case 'html':
        return undefined;
      case 'md':
        return MarkdownParser.parse;
      case 'text':
        return PlaintextParser.parse;
    }
  }

  getScalingOptions(file: FileRecord) {
    return undefined;
  }

  parseDescription(text: string) {
    return text;
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, DefaultOptions>,
    accountData: CustomAccountData,
  ): Promise<PostResponse> {
    if (!accountData.notificationUrl) {
      throw new Error('Custom website was not provided a Notification Posting URL.');
    }

    const descriptionParser = this.getAccountInfo(data.part.accountId, 'parser');
    const form: any = {
      [accountData.descriptionField || 'description']: descriptionParser
        ? descriptionParser(data.description)
        : data.description,
      [accountData.tagField || 'tags']: data.tags.join(','),
      [accountData.titleField || 'title']: data.title,
      [accountData.ratingField || 'rating']: data.rating,
    };

    const headers: any = {};
    accountData.headers.forEach(header => {
      headers[header.name] = header.value;
    });

    this.checkCancelled(cancellationToken);
    const post = await Http.post(accountData.notificationUrl, undefined, {
      type: 'multipart',
      data: form,
      headers: headers,
    });

    this.verifyResponse(post);
    return this.createPostResponse({});
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<DefaultFileOptions>,
    accountData: CustomAccountData,
  ): Promise<PostResponse> {
    if (!accountData.fileUrl) {
      throw new Error('Custom website was not provided a File Posting URL.');
    }

    const descriptionParser = this.getAccountInfo(data.part.accountId, 'parser');
    const form: any = {
      [accountData.descriptionField || 'description']: descriptionParser
        ? descriptionParser(data.description)
        : data.description,
      [accountData.tagField || 'tags']: data.tags.join(','),
      [accountData.titleField || 'title']: data.title,
      [accountData.ratingField || 'rating']: data.rating,
      [accountData.fileField || 'file']: data.primary.file,
      [accountData.thumbnaiField || 'thumbnail']: data.thumbnail,
    };

    const headers: any = {};
    accountData.headers.forEach(header => {
      headers[header.name] = header.value;
    });

    this.checkCancelled(cancellationToken);
    const post = await Http.post(accountData.fileUrl, undefined, {
      type: 'multipart',
      data: form,
      headers,
    });

    this.verifyResponse(post);
    return this.createPostResponse({});
  }

  transformAccountData(data: CustomAccountData) {
    return data;
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<DefaultFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    return { problems, warnings };
  }
}
