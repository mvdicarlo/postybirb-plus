import { Injectable, Logger } from '@nestjs/common';
import UserAccountEntity from 'src/account/models/user-account.entity';
import { PlaintextParser } from 'src/description-parsing/plaintext/plaintext.parser';
import ImageManipulator from 'src/file-manipulation/manipulators/image.manipulator';
import Http from 'src/http/http.util';
import { FileSubmissionType } from 'src/submission/file-submission/enums/file-submission-type.enum';
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
import FileSize from 'src/utils/filesize.util';
import FormContent from 'src/utils/form-content.util';
import { LoginResponse } from '../interfaces/login-response.interface';
import { ScalingOptions } from '../interfaces/scaling-options.interface';
import { Website } from '../website.base';
import { DiscordDefaultFileOptions, DiscordDefaultNotificationOptions } from './discord.defaults';
import { DiscordFileOptions, DiscordNotificationOptions } from './discord.interface';
import { DiscordAccountData } from './discord.account.interface';
import { MarkdownParser } from 'src/description-parsing/markdown/markdown.parser';
import * as lowdb from 'lowdb';
import { Settings } from 'src/settings/settings.interface';

@Injectable()
export class Discord extends Website {
    private readonly logger = new Logger(Discord.name);
    private readonly settings: lowdb.LowdbSync<Settings> = global.settingsDB;

    readonly BASE_URL: string = '';
    readonly acceptsFiles: string[] = []; // accepts all
    readonly acceptsAdditionalFiles: boolean = true;
    readonly enableAdvertisement: boolean = false;

    readonly fileSubmissionOptions: DiscordFileOptions = DiscordDefaultFileOptions;
    readonly notificationSubmissionOptions: DiscordNotificationOptions = DiscordDefaultNotificationOptions;
    readonly defaultDescriptionParser = MarkdownParser.parse;

    readonly usernameShortcuts = [];
    private maxMBPerFile = 0;

    async checkLoginStatus(data: UserAccountEntity): Promise<LoginResponse> {
        const status: LoginResponse = { loggedIn: false, username: null };

        const webhookData: DiscordAccountData = data.data;
        if (webhookData && webhookData.webhook) {
            const channel = await Http.get<any>(webhookData.webhook, undefined, {
                requestOptions: { json: true },
            });

            if (!channel.error && channel.body.id) {
                status.loggedIn = true;
                status.username = webhookData.name;
            }
        }

        return status;
    }

    getScalingOptions(file: FileRecord): ScalingOptions {
        return { maxSize: FileSize.MBtoBytes(this.maxMBPerFile) };
    }

    async postNotificationSubmission(
        cancellationToken: CancellationToken,
        data: PostData<Submission, DiscordNotificationOptions>,
        accountData: DiscordAccountData,
    ): Promise<PostResponse> {
        this.logger.log("postNotificationSubmission");
        let description = data.description.substring(0, 2000).trim();

        const mentions = description.match(/(<){0,1}@(&){0,1}[a-zA-Z0-9]+(>){0,1}/g) || [];

        const json = {
            content: mentions.length ? mentions.join(' ') : undefined,
            allowed_mentions: {
                parse: ['everyone', 'users', 'roles'],
            },
            embeds: [
                {
                    title: data.options.useTitle ? data.title : undefined,
                    description,
                },
            ],
        };

        this.logger.log("Advertise Setting: " + this.settings.get("advertise").value());
        if (this.settings.get("advertise").value()) {
            json["username"] = "PostyBirb";
            json["avatar_url"] = "https://i.imgur.com/l2mt2Q7.png";
            json.embeds[0]["footer"] = "Posted using PostyBirb";
        }

        this.checkCancelled(cancellationToken);
        const res = await Http.post<any>(accountData.webhook.trim(), '', {
            data: json,
            type: 'json',
            skipCookies: true,
        });

        if (res.error || res.response.statusCode >= 300) {
            return Promise.reject(
                this.createPostResponse({
                    error: res.error,
                    message: 'Webhook Failure',
                    additionalInfo: res.body,
                }),
            );
        }

        return this.createPostResponse({ additionalInfo: res.body });
    }

    async postFileSubmission(
        cancellationToken: CancellationToken,
        data: FilePostData<DiscordFileOptions>,
        accountData: DiscordAccountData,
    ): Promise<PostResponse> {
        this.logger.log("postFileSubmission");
        /*if (data.description && data.description.length) {
            this.logger.log("Passed data.description check");
            await this.postNotificationSubmission(
                cancellationToken,
                data as PostData<Submission, DiscordFileOptions>,
                accountData,
            );
        }*/

        let description = data.description.substring(0, 2000).trim();

        const mentions = description.match(/(<){0,1}@(&){0,1}[a-zA-Z0-9]+(>){0,1}/g) || [];

        var json = {
            content: mentions.length ? mentions.join(' ') : undefined,
            allowed_mentions: {
                parse: ['everyone', 'users', 'roles'],
            },
            embeds: [
                {
                    title: data.options.useTitle ? data.title : undefined,
                    description,
                    color: 12487374
                },
            ],
        };

        this.logger.log("Advertise Setting: " + this.settings.get("advertise").value());
        if (this.settings.get("advertise").value()) {
            json["username"] = "PostyBirb";
            json["avatar_url"] = "https://i.imgur.com/l2mt2Q7.png";
            json.embeds[0]["footer"] = "Posted using PostyBirb";
        }

        let error = null;
        const files = [data.primary, ...data.additional];
        this.checkCancelled(cancellationToken);

        
        if (data.options.spoiler) {
            files[0].file.options.filename = `SPOILER_${files[0].file.options.filename}`;
        }
        

        var formData = { payload_json: JSON.stringify(json) };
        var fileNum = 0;
        for (const file of files) {
            fileNum++;
            if (data.options.spoiler) {
                file.file.options.filename = `SPOILER_${file.file.options.filename}`;
            }
            formData["file" + fileNum] = file.file;
        }
        //Potential TODO: Split into seperate uploads if file size above discord limit.

        const res = await Http.post<any>(accountData.webhook.trim(), '', {
            data: formData,
            type: 'multipart',
            skipCookies: true,
        });

        if (res.error || res.response.statusCode >= 300) {
            error = this.createPostResponse({
                error: res.error,
                message: 'Webhook Failure',
                additionalInfo: res.body,
            });
        }

        if (error) {
            this.logger.log(error);
            return Promise.reject(error);
        }

        return this.createPostResponse({});
    }

    transformAccountData(data: DiscordAccountData) {
        return data;
    }

    validateFileSubmission(
        submission: FileSubmission,
        submissionPart: SubmissionPart<DiscordFileOptions>,
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

        //TODO: Dynamically calculate which files need to be scaled down to fit all files into 8MB limit. For now, simple max divided by amount of files will do I guess.
        const maxMB: number = 8;
        this.maxMBPerFile = maxMB / files.length;
        files.forEach(file => {
            const { type, size, name, mimetype } = file;
            if (FileSize.MBtoBytes(this.maxMBPerFile) < size) {
                if (
                    isAutoscaling &&
                    type === FileSubmissionType.IMAGE &&
                    ImageManipulator.isMimeType(mimetype)
                ) {
                    warnings.push(`${name} will be scaled down to ${this.maxMBPerFile}MB`);
                } else {
                    problems.push(`Discord limits ${mimetype} to ${this.maxMBPerFile}MB`);
                }
            }
        });

        const description = this.defaultDescriptionParser(
            FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
        );

        if (description.length > 2000) {
            warnings.push('Max description length allowed is 2,000 characters.');
        }

        return { problems, warnings };
    }

    validateNotificationSubmission(
        submission: FileSubmission,
        submissionPart: SubmissionPart<DiscordNotificationOptions>,
        defaultPart: SubmissionPart<DefaultOptions>,
    ): ValidationParts {
        const problems: string[] = [];
        const warnings: string[] = [];

        const description = this.defaultDescriptionParser(
            FormContent.getDescription(defaultPart.data.description, submissionPart.data.description),
        );

        if (description.length > 2000) {
            warnings.push('Max description length allowed is 2,000 characters.');
        }

        return { problems, warnings };
    }
}
