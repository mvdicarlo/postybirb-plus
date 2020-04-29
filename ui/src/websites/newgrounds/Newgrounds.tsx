import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { DefaultOptions } from '../../../../electron-app/src/submission/submission-part/interfaces/default-options.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { SubmissionType } from '../../shared/enums/submission-type.enum';
import { NewgroundsFileOptions } from '../../../../electron-app/src/websites/newgrounds/newgrounds.interface';
import { Checkbox, Form, Radio } from 'antd';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';
import { GenericDefaultNotificationOptions } from '../../shared/objects/generic-default-notification-options';

const defaultFileOptions: NewgroundsFileOptions = {
  ...GenericDefaultFileOptions,
  creativeCommons: true,
  modification: true,
  commercial: false,
  sketch: false,
  category: '1',
  nudity: undefined,
  violence: undefined,
  explicitText: undefined,
  adultThemes: undefined
};

const defaultNotificationOptions: DefaultOptions = GenericDefaultNotificationOptions;

export class Newgrounds implements Website {
  internalName: string = 'Newgrounds';
  name: string = 'Newgrounds';
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://www.newgrounds.com/login" {...props} />
  );

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, NewgroundsFileOptions>) => (
    <NewgroundsFileSubmissionForm
      key={props.part.accountId}
      ratingOptions={{
        show: false
      }}
      tagOptions={{
        show: true,
        options: {
          maxTags: 12
        }
      }}
      {...props}
    />
  );

  NotificationSubmissionForm = (props: WebsiteSectionProps<Submission, DefaultOptions>) => (
    <GenericSubmissionSection
      key={props.part.accountId}
      {...props}
      tagOptions={{
        show: true,
        options: {
          maxTags: 12
        }
      }}
      ratingOptions={{
        show: false
      }}
    />
  );

  getDefaults(type: SubmissionType) {
    return _.cloneDeep(
      type === SubmissionType.FILE ? defaultFileOptions : defaultNotificationOptions
    );
  }
}

export class NewgroundsFileSubmissionForm extends GenericFileSubmissionSection<
  NewgroundsFileOptions
> {
  renderRightForm(data: NewgroundsFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Nudity">
        <Radio.Group
          onChange={this.handleValueChange.bind(this, 'nudity')}
          value={data.nudity}
          buttonStyle="solid"
        >
          <Radio.Button value="c">None</Radio.Button>
          <Radio.Button value="b">Some</Radio.Button>
          <Radio.Button value="a">Lots</Radio.Button>
        </Radio.Group>
      </Form.Item>,
      <Form.Item label="Violence">
        <Radio.Group
          onChange={this.handleValueChange.bind(this, 'violence')}
          value={data.violence}
          buttonStyle="solid"
        >
          <Radio.Button value="c">None</Radio.Button>
          <Radio.Button value="b">Some</Radio.Button>
          <Radio.Button value="a">Lots</Radio.Button>
        </Radio.Group>
      </Form.Item>,
      <Form.Item label="Explicit Text">
        <Radio.Group
          onChange={this.handleValueChange.bind(this, 'explicitText')}
          value={data.explicitText}
          buttonStyle="solid"
        >
          <Radio.Button value="c">None</Radio.Button>
          <Radio.Button value="b">Some</Radio.Button>
          <Radio.Button value="a">Lots</Radio.Button>
        </Radio.Group>
      </Form.Item>,
      <Form.Item label="Adult Themes">
        <Radio.Group
          onChange={this.handleValueChange.bind(this, 'adultThemes')}
          value={data.adultThemes}
          buttonStyle="solid"
        >
          <Radio.Button value="c">None</Radio.Button>
          <Radio.Button value="b">Some</Radio.Button>
          <Radio.Button value="a">Lots</Radio.Button>
        </Radio.Group>
      </Form.Item>
    );
    return elements;
  }
  renderLeftForm(data: NewgroundsFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox checked={data.sketch} onChange={this.handleCheckedChange.bind(this, 'sketch')}>
          Is a sketch
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.creativeCommons}
          onChange={this.handleCheckedChange.bind(this, 'creativeCommons')}
        >
          Use a Creative Commons license
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.commercial}
          onChange={this.handleCheckedChange.bind(this, 'commercial')}
        >
          Allow commercial uses
        </Checkbox>
      </div>,
      <div>
        <Checkbox
          checked={data.modification}
          onChange={this.handleCheckedChange.bind(this, 'modification')}
        >
          Allow modification
        </Checkbox>
      </div>
    );
    return elements;
  }
}
