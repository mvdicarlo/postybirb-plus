import {
  DefaultFileOptions,
  DefaultFileOptionsEntity,
  DefaultOptions,
  DefaultOptionsEntity,
  FileSubmission,
  Submission,
  SubmissionType
} from 'postybirb-commons';
import React from 'react';
import { WebsiteSectionProps } from './form-sections/website-form-section.interface';
import { GenericLoginDialog } from './generic/GenericLoginDialog';
import { LoginDialogProps, Website } from './interfaces/website.interface';
import { WebsiteOptions } from 'postybirb-commons';

export abstract class WebsiteImpl implements Website {
  abstract internalName: string;
  abstract loginUrl: string;
  abstract name: string;
  supportsAdditionalFiles?: boolean = false;
  supportsTags?: boolean = true;
  supportsParentId?: boolean = false;

  LoginDialog(props: LoginDialogProps): JSX.Element {
    return <GenericLoginDialog url={this.loginUrl} {...props} />;
  }

  LoginHelp?: ((props: LoginDialogProps) => JSX.Element) | undefined;

  abstract FileSubmissionForm: (props: WebsiteSectionProps<FileSubmission, any>) => JSX.Element;

  NotificationSubmissionForm?:
    | ((props: WebsiteSectionProps<Submission, any>) => JSX.Element)
    | undefined;

  getDefaults(type: SubmissionType) {
    const options: {
      FileOptions: typeof DefaultFileOptionsEntity;
      NotificationOptions: typeof DefaultOptionsEntity;
    } = WebsiteOptions[this.internalName];
    switch (type) {
      case SubmissionType.FILE:
        const FileObject: typeof DefaultFileOptionsEntity = options
          ? options.FileOptions || DefaultFileOptionsEntity
          : DefaultFileOptionsEntity;
        return new FileObject().asPlain<DefaultFileOptions>();
      case SubmissionType.NOTIFICATION:
        const NotificationObject: typeof DefaultOptionsEntity = options
          ? options.NotificationOptions || DefaultOptionsEntity
          : DefaultOptionsEntity;
        return new NotificationObject().asPlain<DefaultOptions>();
      default:
        throw new Error(`Unsupported submission type: ${type}`);
    }
  }
}
