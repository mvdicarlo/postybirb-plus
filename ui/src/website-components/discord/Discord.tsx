import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { DefaultDiscordOptions } from '../../../../electron-app/src/websites/discord/discord.interface';
import TagInput from '../../views/submissions/submission-forms/form-components/TagInput';
import DescriptionInput from '../../views/submissions/submission-forms/form-components/DescriptionInput';
import { SubmissionPart } from '../../../../electron-app/src/submission/submission-part/interfaces/submission-part.interface';
import { Alert, Form, Input, Checkbox } from 'antd';
import DiscordLogin from './DiscordLogin';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';

const defaultOptions: DefaultDiscordOptions = {
  embed: true,
  spoiler: false,
  tags: {
    extendDefault: true,
    value: []
  },
  description: {
    overwriteDefault: false,
    value: ''
  },
  rating: null,
  useThumbnail: true,
  autoScale: true
};

export class Discord implements Website {
  name: string = 'Discord';
  supportsAdditionalFiles: boolean = true;
  LoginDialog = (props: LoginDialogProps) => <DiscordLogin {...props} />;

  FileSubmissionForm = (props: SubmissionSectionProps<FileSubmission, DefaultDiscordOptions>) => (
    <DiscordFileSubmissionForm key={props.part.accountId} {...props} />
  );

  NotificationSubmissionForm = (
    props: SubmissionSectionProps<Submission, DefaultDiscordOptions>
  ) => <DiscordFileSubmissionForm key={props.part.accountId} {...props} />;

  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }
}

export class DiscordFileSubmissionForm extends React.Component<
  SubmissionSectionProps<Submission, DefaultDiscordOptions>
> {
  handleChange(fieldName: string, { target }) {
    const part: SubmissionPart<DefaultDiscordOptions> = _.cloneDeep(this.props.part);
    part.data[fieldName] = target.value;
    this.props.onUpdate(part);
  }

  handleTagChange(update: any) {
    const part: SubmissionPart<DefaultDiscordOptions> = _.cloneDeep(this.props.part);
    part.data.tags = update;
    this.props.onUpdate(part);
  }

  handleDescriptionChange(update) {
    const part: SubmissionPart<DefaultDiscordOptions> = _.cloneDeep(this.props.part);
    part.data.description = update;
    this.props.onUpdate(part);
  }

  handleCheckboxChange(fieldName: string, { target }) {
    const part: SubmissionPart<DefaultDiscordOptions> = _.cloneDeep(this.props.part);
    part.data[fieldName] = target.checked;
    this.props.onUpdate(part);
  }

  render() {
    const { data } = this.props.part;
    return (
      <div>
        {this.props.problems.length ? (
          <Alert
            type="error"
            message={
              <ul>
                {this.props.problems.map(problem => (
                  <li>{problem}</li>
                ))}
              </ul>
            }
          />
        ) : null}
        {this.props.warnings.length ? (
          <Alert
            type="warning"
            message={
              <ul>
                {this.props.warnings.map(warning => (
                  <li>{warning}</li>
                ))}
              </ul>
            }
          />
        ) : null}
        <div>
          <Form.Item label="Title">
            <Input
              placeholder="Using default"
              value={data.title}
              onChange={this.handleChange.bind(this, 'title')}
            />
          </Form.Item>
          <TagInput
            onChange={this.handleTagChange.bind(this)}
            defaultValue={data.tags}
            defaultTags={this.props.defaultData!.tags}
            label="Tags"
          />
          <DescriptionInput
            defaultValue={data.description}
            onChange={this.handleDescriptionChange.bind(this)}
            label="Description"
            overwriteDescriptionValue={_.get(this.props.defaultData, 'description.value')}
          />
          <Form.Item>
            <div className="flex">
              <div className="w-full">
                <div>
                  <Checkbox
                    checked={data.autoScale}
                    onChange={this.handleCheckboxChange.bind(this, 'autoScale')}
                  >
                    Downscale images to fit size limit
                  </Checkbox>
                </div>
                <div>
                  <Checkbox
                    checked={data.embed}
                    onChange={this.handleCheckboxChange.bind(this, 'embed')}
                  >
                    Embed description
                  </Checkbox>
                </div>
                <div>
                  <Checkbox
                    checked={data.spoiler}
                    onChange={this.handleCheckboxChange.bind(this, 'spoiler')}
                  >
                    Spoiler
                  </Checkbox>
                </div>
              </div>
            </div>
          </Form.Item>
        </div>
      </div>
    );
  }
}
