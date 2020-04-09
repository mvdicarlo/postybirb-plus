import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { DiscordOptions } from '../../../../electron-app/src/websites/discord/discord.interface';
import TagInput from '../../views/submissions/submission-forms/form-components/TagInput';
import DescriptionInput from '../../views/submissions/submission-forms/form-components/DescriptionInput';
import { SubmissionPart } from '../../../../electron-app/src/submission/submission-part/interfaces/submission-part.interface';
import { Form, Input, Checkbox } from 'antd';
import DiscordLogin from './DiscordLogin';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import SectionProblems from '../../views/submissions/submission-forms/form-sections/SectionProblems';

const defaultOptions: DiscordOptions = {
  spoiler: false,
  useTitle: true,
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
  internalName: string = 'Discord';
  name: string = 'Discord';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = false;
  LoginDialog = (props: LoginDialogProps) => <DiscordLogin {...props} />;

  FileSubmissionForm = (props: SubmissionSectionProps<FileSubmission, DiscordOptions>) => (
    <DiscordFileSubmissionForm key={props.part.accountId} {...props} />
  );

  NotificationSubmissionForm = (props: SubmissionSectionProps<Submission, DiscordOptions>) => (
    <DiscordFileSubmissionForm key={props.part.accountId} {...props} />
  );

  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }
}

export class DiscordFileSubmissionForm extends React.Component<
  SubmissionSectionProps<Submission, DiscordOptions>
> {
  handleChange(fieldName: string, { target }) {
    const part: SubmissionPart<DiscordOptions> = _.cloneDeep(this.props.part);
    part.data[fieldName] = target.value;
    this.props.onUpdate(part);
  }

  handleTagChange(update: any) {
    const part: SubmissionPart<DiscordOptions> = _.cloneDeep(this.props.part);
    part.data.tags = update;
    this.props.onUpdate(part);
  }

  handleDescriptionChange(update) {
    const part: SubmissionPart<DiscordOptions> = _.cloneDeep(this.props.part);
    part.data.description = update;
    this.props.onUpdate(part);
  }

  handleCheckboxChange(fieldName: string, { target }) {
    const part: SubmissionPart<DiscordOptions> = _.cloneDeep(this.props.part);
    part.data[fieldName] = target.checked;
    this.props.onUpdate(part);
  }

  render() {
    const { data } = this.props.part;
    return (
      <div>
        <SectionProblems problems={this.props.problems} />
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
                    checked={data.useTitle}
                    onChange={this.handleCheckboxChange.bind(this, 'useTitle')}
                  >
                    Use Title
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
