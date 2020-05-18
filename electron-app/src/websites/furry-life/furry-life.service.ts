import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import UserAccountEntity from 'src/account/models/user-account.entity';
import ImageManipulator from 'src/file-manipulation/manipulators/image.manipulator';
import Http from 'src/http/http.util';
import { SubmissionRating } from 'src/submission/enums/submission-rating.enum';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';
import { FileRecord } from 'src/submission/file-submission/interfaces/file-record.interface';
import { FileSubmission } from 'src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from 'src/submission/interfaces/submission.interface';
import { CancellationToken } from 'src/submission/post/cancellation/cancellation-token';
import { FilePostData, PostFile } from 'src/submission/post/interfaces/file-post-data.interface';
import { PostData } from 'src/submission/post/interfaces/post-data.interface';
import { PostResponse } from 'src/submission/post/interfaces/post-response.interface';
import { DefaultOptions } from 'src/submission/submission-part/interfaces/default-options.interface';
import { SubmissionPart } from 'src/submission/submission-part/interfaces/submission-part.interface';
import { ValidationParts } from 'src/submission/validator/interfaces/validation-parts.interface';
import BrowserWindowUtil from 'src/utils/browser-window.util';
import FileSize from 'src/utils/filesize.util';
import WebsiteValidator from 'src/utils/website-validator.util';
import { GenericDefaultNotificationOptions } from '../generic/generic.defaults';
import { Folder } from '../interfaces/folder.interface';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import { FurryLifeDefaultFileOptions } from './furry-life.defaults';
import { FurryLifeFileOptions } from './furry-life.interface';

@Injectable()
export class FurryLife extends Website {
  readonly BASE_URL = 'https://furrylife.online';
  readonly acceptsFiles = ['jpeg', 'jpg', 'png', 'gif'];
  readonly acceptsAdditionalFiles = true;
  readonly fileSubmissionOptions = FurryLifeDefaultFileOptions;
  readonly notificationSubmissionOptions = GenericDefaultNotificationOptions;

  async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
    const status: LoginResponse = { loggedIn: false, username: null };
    const res = await Http.get<string>(`${this.BASE_URL}/user/home`, data._id);
    if (res.body.includes('Sign Out')) {
      status.loggedIn = true;
      const $ = cheerio.load(res.body);
      status.username = $('#elUserLink')
        .text()
        .trim();

      try {
        await this.loadAlbums(data._id, 1);
        await this.loadAlbums(data._id, 2);
      } catch {}
    }
    return status;
  }

  private async loadAlbums(profileId: string, albumId: number) {
    const albumPage = await Http.get<string>(
      `${this.BASE_URL}/gallery/submit/?noWrapper=1&category=${albumId}`,
      profileId,
    );
    const isNSFWAlbum = albumId === 2;
    if (isNSFWAlbum && albumPage.body.includes('(SFW)')) {
      return;
    }

    const folder: Folder = {
      value: isNSFWAlbum ? 'nsfw' : 'sfw',
      label: isNSFWAlbum ? 'NSFW' : 'SFW',
      children: [
        {
          value: isNSFWAlbum ? '0-nsfw' : '0-sfw',
          label: isNSFWAlbum ? 'General (NSFW)' : 'General (SFW)',
          nsfw: isNSFWAlbum,
        },
      ],
      nsfw: isNSFWAlbum,
    };

    const $ = cheerio.load(albumPage.body);
    $('#elGallerySubmit_albumChooser')
      .children()
      .each((i, e) => {
        const $e = $(e);
        folder.children.push({
          nsfw: isNSFWAlbum,
          value: `${$e.find('input').val()}-${isNSFWAlbum ? 'nsfw' : 'sfw'}`,
          label: $e.find('strong').text(),
        });
      });

    const folders = this.getAccountInfo(profileId, 'folders') || [];
    folders[albumId - 1] = folder;
    this.storeAccountInformation(profileId, 'folders', folders);
  }

  getScalingOptions(file: FileRecord): ScalingOptions {
    return { maxSize: FileSize.MBtoBytes(1023) };
  }

  parseDescription(text: string) {
    return text;
  }

  async postFileSubmission(
    cancellationToken: CancellationToken,
    data: FilePostData<FurryLifeFileOptions>,
  ): Promise<PostResponse> {
    const { options } = data;

    // TODO maybe change so that -nsfw doesn't need to be in the id
    const albumParts = options.album.split('-');
    const album = albumParts[0];
    const category = albumParts[1].includes('nsfw') ? 2 : 1;

    const files = [data.primary, ...data.additional];
    const albumParam: string = `${album === '0' ? 'noAlbum=1' : 'album=' + album}`;

    const form: any = await BrowserWindowUtil.getFormData(
      data.part.accountId,
      `${this.BASE_URL}/gallery/submit/?_pi=&category=${category}&${albumParam}`,
      { id: 'elGallerySubmit' },
    );

    this.checkCancelled(cancellationToken);
    try {
      const uploads = await Promise.all(
        files.map(file =>
          this.uploadImage(data.part.accountId, form.images, albumParam, category, file.file),
        ),
      );

      Object.assign(form, {
        upload_images_submitted: '1',
        credit_all: options.credit || '',
        copyright_all: options.copyright || '',
        tags_all: data.tags.join('\r\n') || '',
        prefix_all: '',
        images_order: uploads.map(u => u.id),
        images_autofollow_all: '0',
      });

      const images_info: any[] = [];
      uploads.forEach(u => {
        images_info.push({ name: `image_title_${u.id}`, value: data.title });
        images_info.push({ name: `filedata__image_description_${u.id}`, value: data.description });
        images_info.push({ name: `image_textarea_${u.id}`, value: '' });
        images_info.push({ name: `image_tags_${u.id}_original`, value: '' });
        images_info.push({ name: `image_tags_${u.id}`, value: '' });
        images_info.push({ name: `image_credit_info_${u.id}`, value: '' });
        images_info.push({ name: `image_copyright_${u.id}`, value: '' });
        images_info.push({ name: `image_gps_show_${u.id}`, value: '0' });

        form[`images_existing[o_${u.id}]`] = u.id;
        form[`images_keep[o_${u.id}]`] = '1';
      });

      form.images_info = JSON.stringify(images_info);

      this.checkCancelled(cancellationToken);
      const post = await Http.post(
        `${this.BASE_URL}/gallery/submit/?_pi=&category=${category}&${albumParam}&noWrapper=1`,
        data.part.accountId,
        {
          type: 'multipart',
          data: form,
          headers: {
            referer: 'https://furrylife.online',
            origin: 'https://furrylife.online',
          },
        },
      );

      this.verifyResponse(post, 'Post verify');
      for (let i = 0; i < uploads.length; i++) {
        let url: string = `${this.BASE_URL}/gallery/submit/?_pi=&category=${category}&${albumParam}&totalImages=${uploads.length}&do=saveImages&mr=${i}&csrfKey=${form.csrfKey}`;
        if (i === 0) {
          url += '&_mrReset=1';
        }
        await Http.get(url, data.part.accountId);
        // MAJOR NOTE: I HAVE NO CLUE HOW TO VALIDATE A TRUE SUCCESS WENT THROUGH
      }
      return this.createPostResponse({});
    } catch (err) {
      return Promise.reject(this.createPostResponse({ additionalInfo: err }));
    }
  }

  private async uploadImage(
    profileId: string,
    uploadKey: any,
    albumParam: string,
    category: number,
    file: PostFile,
  ) {
    const data = {
      title: file.options.filename,
      images: file,
      chunk: '0',
      chunks: '1',
    };

    const upload = await Http.post<{ id: string }>(
      `${this.BASE_URL}/gallery/submit/?_pi=&category=${category}&${albumParam}`,
      profileId,
      {
        type: 'multipart',
        data,
        requestOptions: { json: true },
        headers: {
          referer: 'https://furrylife.online',
          origin: 'https://furrylife.online',
          'x-plupload': uploadKey,
        },
      },
    );

    if (upload.body.id) {
      return upload.body;
    }
    return Promise.reject(this.createPostResponse({ additionalInfo: upload.body }));
  }

  async postNotificationSubmission(
    cancellationToken: CancellationToken,
    data: PostData<Submission, DefaultOptions>,
  ): Promise<PostResponse> {
    const form: any = await BrowserWindowUtil.getFormData(
      data.part.accountId,
      `${this.BASE_URL}/index.php?app=core&module=status&controller=ajaxcreate`,
      { id: 'elStatusSubmit' },
    );
    form.status_content_ajax = data.description;

    this.checkCancelled(cancellationToken);
    const post = await Http.post<string>(
      `${this.BASE_URL}/index.php?app=core&module=status&controller=ajaxcreate&ajaxValidate=1`,
      data.part.accountId,
      {
        type: 'multipart',
        data: form,
      },
    );

    this.verifyResponse(post, 'Verify post');
    if (post.returnUrl.includes('profile')) {
      return this.createPostResponse({});
    }

    return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
  }

  validateFileSubmission(
    submission: FileSubmission,
    submissionPart: SubmissionPart<FurryLifeFileOptions>,
    defaultPart: SubmissionPart<DefaultOptions>,
  ): ValidationParts {
    const problems: string[] = [];
    const warnings: string[] = [];
    const isAutoscaling: boolean = submissionPart.data.autoScale;

    const folder = submissionPart.data.album;
    const rating = submissionPart.data.rating || defaultPart.data.rating;
    if (folder.includes('nsfw') && rating === SubmissionRating.GENERAL) {
      problems.push('Cannot upload NSFW to SFW Album');
    }

    if (
      !WebsiteValidator.folderIdExists(
        folder,
        this.getAccountInfo(submissionPart.accountId, 'folders'),
      )
    ) {
      warnings.push(`Album (${folder}) not found.`);
    }

    const files = [
      submission.primary,
      ...(submission.additional || []).filter(
        f => !f.ignoredAccounts!.includes(submissionPart.accountId),
      ),
    ];

    const maxMB: number = 1023;
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
          problems.push(`FurryLife limits ${mimetype} to ${maxMB}MB`);
        }
      }
    });

    return { problems, warnings };
  }
}
