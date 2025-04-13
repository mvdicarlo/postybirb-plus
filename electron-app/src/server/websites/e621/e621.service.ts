import { Injectable } from '@nestjs/common';
import { app } from 'electron';
import {
  DefaultOptions,
  e621AccountData,
  e621FileOptions,
  FileRecord,
  FileSubmission,
  FileSubmissionType,
  PostResponse,
  SubmissionPart,
  SubmissionRating,
} from 'postybirb-commons';
import UserAccountEntity from 'src/server//account/models/user-account.entity';
import { UsernameParser } from 'src/server/description-parsing/miscellaneous/username.parser';
import { PlaintextParser } from 'src/server/description-parsing/plaintext/plaintext.parser';
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
import { RateLimiterUtil } from 'src/server/utils/rate-limiter.util';
import { CancellationException } from 'src/server/submission/post/cancellation/cancellation.exception';
import { CancellationTokenDynamic } from 'src/server/submission/post/cancellation/cancellation-token-dynamic';

@Injectable()
export class e621 extends Website {
  readonly BASE_URL: string = 'https://e621.net';
  readonly MAX_CHARS: number = undefined; // No limit
  readonly acceptsFiles: string[] = ['jpeg', 'jpg', 'png', 'gif', 'webm'];
  readonly acceptsSourceUrls: boolean = true;
  readonly defaultDescriptionParser = PlaintextParser.parse;
  readonly enableAdvertisement: boolean = false;
  readonly MAX_MB = 100;

  readonly usernameShortcuts = [
    {
      key: 'e6',
      url: 'https://e621.net/user/show/$1',
    },
  ];

  private readonly headers = { 'User-Agent': `PostyBirb/${app.getVersion()}` };

  // e621 has hard limit of 2req/1sec, so its a 1req/500ms
  private rateLimit = new RateLimiterUtil(500);

  private async request<T>(
    cancellationToken: CancellationTokenDynamic,
    method: 'get' | 'post',
    url: string,
    form?: unknown,
  ) {
    await this.rateLimit.trigger(cancellationToken);

    return await Http[method]<T>(`${this.BASE_URL}${url}`, undefined, {
      skipCookies: true,
      requestOptions: { json: true },
      headers: this.headers,
      ...(form && method === 'post' ? { type: 'multipart', data: form } : {}),
    });
  }

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const accountData: e621AccountData = data.data;
    if (accountData?.username) {
      status.username = accountData.username;
      status.loggedIn = true;
    }
    this.storeAccountInformation(data._id, 'username', status.username);
    return status;
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(this.MAX_MB) };
  }

  preparseDescription(text: string) {
    return UsernameParser.replaceText(text, 'e6', '@$1').replace(
      /<a(.*?)href="(.*?)"(.*?)>(.*?)<\/a>/gi,
      '"$4":$2',
    );
  }

  parseDescription(text: string) {
    text = text.replace(/<b>/gi, '[b]');
    text = text.replace(/<i>/gi, '[i]');
    text = text.replace(/<u>/gi, '[u]');
    text = text.replace(/<s>/gi, '[s]');
    text = text.replace(/<\/b>/gi, '[/b]');
    text = text.replace(/<\/i>/gi, '[/i]');
    text = text.replace(/<\/u>/gi, '[/u]');
    text = text.replace(/<\/s>/gi, '[/s]');
    text = text.replace(/<em>/gi, '[i]');
    text = text.replace(/<\/em>/gi, '[/i]');
    text = text.replace(/<strong>/gi, '[b]');
    text = text.replace(/<\/strong>/gi, '[/b]');
    text = text.replace(
      /<span style="color:\s*(.*?);*">((.|\n)*?)<\/span>/gim,
      '[color=$1]$2[/color]',
    );
    text = text.replace(/<a(.*?)href="(.*?)"(.*?)>(.*?)<\/a>/gi, '"$4":$2');
    return super.parseDescription(text);
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<e621FileOptions>,
    accountData: e621AccountData,
  ): Promise<PostResponse> {
    const form = {
      login: accountData.username,
      api_key: accountData.key,
      'upload[tag_string]': this.formatTags(data.tags).join(' ').trim(),
      'upload[file]': data.primary.file,
      'upload[rating]': this.getRating(data.rating),
      'upload[description]': data.description,
      'upload[parent_id]': data.options.parentId || '',
      'upload[source]': [...data.options.sources, ...data.sources]
        .filter(s => s)
        .slice(0, 10)
        .join('%0A'),
    };

    this.checkCancelled(cancellationToken);
    const post = await this.request<{
      success: boolean;
      location: string;
      reason: string;
      message: string;
    }>(new CancellationTokenDynamic(), 'post', `/uploads.json`, form);

    if (post.body.success && post.body.location) {
      return this.createPostResponse({ source: `https://e621.net${post.body.location}` });
    }

    return Promise.reject(
      this.createPostResponse({
        additionalInfo: JSON.stringify(post.body),
        message: `${post.body.reason || ''} || ${post.body.message || ''}`,
      }),
    );
  }

  private getRating(rating: SubmissionRating) {
    switch (rating) {
      case SubmissionRating.MATURE:
        return 'q';
      case SubmissionRating.ADULT:
      case SubmissionRating.EXTREME:
        return 'e';
      case SubmissionRating.GENERAL:
      default:
        return 's';
    }
  }

  transformAccountData(data: e621AccountData) {
    return {
      username: data?.username,
    };
  }

  private tagIsInvalid(context: TagCheckingContext, tag: string) {
    const wikiLink = `See https://e621.net/wiki_pages/show_or_new?title=${tag}.`;
    const createTagNotice = ` ${wikiLink} If you want to create a new tag, make a post with it, and then go to the https://e621.net/tags?search[name]=${tag}, press edit and select tag category`;

    context.warnings.push(
      `Tag ${tag} does not exist yet or is invalid.${
        context.ifYouWantToCreateNotice ? createTagNotice : ''
      }`,
    );
    context.ifYouWantToCreateNotice = false;
  }

  // Used to debounce long running validation requests
  private validateSubmissionCancelTokens = new Map<string, CancellationTokenDynamic>();

  async validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<any>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): Promise<ValidationParts> {
    const oldToken = this.validateSubmissionCancelTokens.get(submission._id);
    if (oldToken) oldToken.cancel();

    const cancellationToken = new CancellationTokenDynamic();
    this.validateSubmissionCancelTokens.set(submission._id, cancellationToken);

    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    try {
      await this.validateTags(defaultPart, submissionPart, problems, warnings, cancellationToken);
      await this.validateUserFeedback(submissionPart, warnings, cancellationToken);
    } catch (e) {
      // Ignore validation canceled errors
      if (!(e instanceof CancellationException)) throw e;
    }

    if (!WebsiteValidator.supportsFileType(submission.primary, this.acceptsFiles)) {
      problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
    }

    const { type, size, name } = submission.primary;

    if (FileSize.MBtoBytes(this.MAX_MB) < size) {
      if (
        isAutoscaling &&
        type === FileSubmissionType.IMAGE &&
        ImageManipulator.isMimeType(submission.primary.mimetype)
      ) {
        warnings.push(`${name} will be scaled down to ${this.MAX_MB}MB`);
      } else {
        problems.push(`e621 limits ${submission.primary.mimetype} to ${this.MAX_MB}MB`);
      }
    }

    return { problems, warnings };
  }

  private async validateUserFeedback(
    submissionPart: SubmissionPart<any>,
    warnings: string[],
    cancellationToken: CancellationTokenDynamic,
  ) {
    try {
      const username = this.getAccountInfo(submissionPart.accountId, 'username');
      const feedbacks = await this.getUserFeedback(cancellationToken, username);

      if (Array.isArray(feedbacks)) {
        for (const feedback of feedbacks) {
          if (feedback.category === e621UserFeedbackCategory.Positive) continue;

          const updatedAt = new Date(feedback.updated_at);
          const week =
            /*ms*/ 1000 * /*sec*/ 60 * /*min*/ 60 * /*hour*/ 60 * /*day*/ 24 * /*week*/ 7;

          if (Date.now() - updatedAt.getTime() > week) continue;

          warnings.push(
            `You have recent ${
              feedback.category
            } feedback at the https://e621.net/user_feedbacks?search[user_name]=${username}. Feedback: ${
              feedback.body.length > 100
                ? `${feedback.body.slice(0, 100)}... (More on the e621)`
                : feedback.body
            }`,
          );
        }
      }
    } catch (error) {
      this.logger.error(error);
      warnings.push(`Unable to get user feedback. You can check your account manually`);
    }
  }

  private async validateTags(
    defaultPart: SubmissionPart<DefaultOptions>,
    submissionPart: SubmissionPart<any>,
    problems: string[],
    warnings: string[],
    cancellationToken: CancellationTokenDynamic,
  ) {
    const tags = FormContent.getTags(defaultPart.data.tags, submissionPart.data.tags);
    if (tags.length < 4) {
      problems.push('Requires at least 4 tags.');
    }

    if (tags.length) {
      try {
        const formattedTags = this.formatTags(tags);
        const tagsMeta = await this.getTagMetadata(cancellationToken, formattedTags);
        const context: TagCheckingContext = {
          ifYouWantToCreateNotice: true,
          generalTags: 0,
          problems,
          warnings,
          cancellationToken,
        };

        if (Array.isArray(tagsMeta)) {
          // All tags do exists but may be still invalid
          const tagsSet = new Set(formattedTags);

          for (const tagMeta of tagsMeta) {
            tagsSet.delete(tagMeta.name);
            this.validateTag(tagMeta, context);
          }

          // Some tags are just not being returned in the response for some unknown reason
          for (const tag of tagsSet) await this.getAndValidateSingleTag(tag, context);
        } else {
          // Some of the tags does not exists, iterate through all
          // of them because there is no other way to check
          for (const tag of formattedTags) await this.getAndValidateSingleTag(tag, context);
        }

        if (context.generalTags < 10) {
          warnings.push(
            `It is recommended to add at least 10 general tags ( ${context.generalTags} / 10 ). See https://e621.net/help/tagging_checklist`,
          );
        }
      } catch (error) {
        this.logger.error(error);
        warnings.push(`Unable to validate tags. Please check them manually`);
      }
    }
  }

  private async getAndValidateSingleTag(tag: string, context: TagCheckingContext) {
    const tagsMeta = await this.getTagMetadata(context.cancellationToken, [tag]);

    if (Array.isArray(tagsMeta)) {
      this.validateTag(tagsMeta[0], context);
    } else this.tagIsInvalid(context, tag);
  }

  private validateTag(tagMeta: e621Tag, context: TagCheckingContext) {
    if (tagMeta.category === e621TagCategory.Invalid) {
      context.problems.push(
        `Tag ${tagMeta.name} is invalid. See https://e621.net/wiki_pages/show_or_new?title=${tagMeta.name}`,
      );
    }

    if (tagMeta.post_count < 2) {
      context.warnings.push(
        `Tag ${tagMeta.name} has ${tagMeta.post_count} post(s). Tag may be invalid or low use`,
      );
    }

    if (tagMeta.category === e621TagCategory.General) context.generalTags++;
  }

  private async getUserFeedback(cancellationToken: CancellationTokenDynamic, username: string) {
    return this.getMetdata<e621UserFeedbacksEmpty | e621UserFeedbacks>(
      cancellationToken,
      `/user_feedbacks.json?search[user_name]=${username}`,
    );
  }

  private async getTagMetadata(
    cancellationToken: CancellationTokenDynamic,
    formattedTags: string[],
  ) {
    return this.getMetdata<e621TagsEmpty | e621Tags>(
      cancellationToken,
      `/tags.json?search[name]=${formattedTags.join(',')}`,
    );
  }

  private metadataCache = new Map<string, object>();

  private async getMetdata<T extends object>(
    cancellationToken: CancellationTokenDynamic,
    url: string,
  ) {
    const cached = this.metadataCache.get(url) as T;
    if (cached) return cached;

    const response = await this.request<object>(cancellationToken, 'get', url);
    if (response.error) throw response.error;

    const result = response.body;
    this.metadataCache.set(url, result);

    return result;
  }
}

interface TagCheckingContext {
  ifYouWantToCreateNotice: boolean;
  generalTags: number;
  warnings: string[];
  problems: string[];
  cancellationToken: CancellationTokenDynamic;
}

// Source: https://e621.net/tags
enum e621TagCategory {
  General = 0,
  Artist = 1,
  Contributor = 2,
  Copyright = 3,
  Character = 4,
  Species = 5,
  Invalid = 6,
  Meta = 7,
  Lore = 8,
}

// Source: https://e621.net/tags.json?search[name]=nonexistenttag
interface e621TagsEmpty {
  tags: [];
}

// Source https://e621.net/tags.json?search[name]=furry
type e621Tags = e621Tag[];

// Source https://e621.net/tags.json?search[name]=furry
interface e621Tag {
  id: number;
  name: string;
  post_count: number;

  // example: 'anthro 2 duo 2 female 2 furry 2 male 2 male/female 2 mammal 2 beach 1 beatrice_doodledox 1 big_butt 1 bikini 1 credits 1 drew 1 hand_on_butt 1 hi_res 1 human 1 humanoid 1 lion 1 signature 1 spicebunny 1 spicebxnny 1 text 1 this 1 two-piece_swimsuit 1 underwear 1'
  related_tags: string;

  // example: '2025-01-20T00:16:49.927+03:00'
  related_tags_updated_at: string;

  category: e621TagCategory;

  // example: false
  is_locked: boolean;

  // example: '2020-03-05T13:49:37.994+03:00'
  created_at: string;

  // example: '2025-01-20T00:16:49.928+03:00'
  updated_at: string;
}

// Source: https://e621.net/user_feedbacks.json
interface e621UserFeedbacksEmpty {
  user_feedbacks: [];
}

// Source: https://e621.net/user_feedbacks.json?search[user_name]=fishys1
type e621UserFeedbacks = e621UserFeedback[];

// Source: https://e621.net/user_feedbacks
enum e621UserFeedbackCategory {
  Neutral = 'neutral',
  Negative = 'negative',
  Positive = 'positive',
}

// Source: https://e621.net/user_feedbacks.json?search[user_name]=fishys1
interface e621UserFeedback {
  id: number;
  user_id: number;
  creator_id: number;
  // example: '2025-01-04T06:55:21.562+03:00'
  created_at: string;
  // example: 'Please do not post advertisements for you YCH auctions.  "[1]":/posts/5263398 "[2]":/posts/5280084\n\n[section=Advertising]\n* Do not promote any external sites, resources, products, or services.\n* If you are an artist or content owner, you are permitted to advertise products and services you may offer. You may do so in the "description" field of your posts, on the artist page, and in your profile description.\n\nIf you wish to promote your products or services through a banner ad, please contact `ads@dragonfru.it` with any questions. See the "advertisement help page":/help/advertising for more information.\n\n"[Code of Conduct - Advertising]":/wiki_pages/e621:rules#advertising\n[/section]\n'
  body: string;
  category: e621UserFeedbackCategory;
  // example: '2025-01-04T06:55:21.562+03:00'
  updated_at: string;
  updater_id: string;
  is_deleted: boolean;
}
