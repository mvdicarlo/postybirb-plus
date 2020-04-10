import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { DerpibooruOptions } from '../../../../electron-app/src/websites/derpibooru/derpibooru.interface';
import TagInput from '../../views/submissions/submission-forms/form-components/TagInput';
import DescriptionInput from '../../views/submissions/submission-forms/form-components/DescriptionInput';
import { SubmissionPart } from '../../../../electron-app/src/submission/submission-part/interfaces/submission-part.interface';
import { Form, Input, Radio, Checkbox } from 'antd';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import SectionProblems from '../../views/submissions/submission-forms/form-sections/SectionProblems';

const defaultOptions: DerpibooruOptions = {
  title: undefined,
  useThumbnail: true,
  autoScale: true,
  rating: null,
  source: null,
  tags: {
    extendDefault: true,
    value: []
  },
  description: {
    overwriteDefault: false,
    value: ''
  }
};

export class Derpibooru implements Website {
  internalName: string = 'Derpibooru';
  name: string = 'Derpibooru';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://derpibooru.org/session/new" {...props} />
  );

  FileSubmissionForm = (props: SubmissionSectionProps<FileSubmission, DerpibooruOptions>) => (
    <DerpibooruFileSubmissionForm key={props.part.accountId} {...props} />
  );

  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }
}

export class DerpibooruFileSubmissionForm extends React.Component<
  SubmissionSectionProps<FileSubmission, DerpibooruOptions>
> {
  constructor(props: SubmissionSectionProps<FileSubmission, DerpibooruOptions>) {
    super(props);
    this.state = {
      folders: []
    };
  }

  handleChange(fieldName: string, { target }) {
    const part: SubmissionPart<DerpibooruOptions> = _.cloneDeep(this.props.part);
    part.data[fieldName] = target.value;
    this.props.onUpdate(part);
  }

  handleTagChange(update: any) {
    const part: SubmissionPart<DerpibooruOptions> = _.cloneDeep(this.props.part);
    part.data.tags = update;
    this.props.onUpdate(part);
  }

  handleDescriptionChange(update) {
    const part: SubmissionPart<DerpibooruOptions> = _.cloneDeep(this.props.part);
    part.data.description = update;
    this.props.onUpdate(part);
  }

  handleSelectChange(fieldName: string, value: any) {
    const part: SubmissionPart<DerpibooruOptions> = _.cloneDeep(this.props.part);
    part.data[fieldName] = value;
    this.props.onUpdate(part);
  }

  handleCheckboxChange(fieldName: string, { target }) {
    const part: SubmissionPart<DerpibooruOptions> = _.cloneDeep(this.props.part);
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
          <Form.Item label="Rating">
            <Radio.Group
              onChange={this.handleChange.bind(this, 'rating')}
              value={data.rating}
              buttonStyle="solid"
            >
              <Radio.Button value={null}>Default</Radio.Button>
              <Radio.Button value="general">General</Radio.Button>
              <Radio.Button value="mature">Mature</Radio.Button>
              <Radio.Button value="adult">Adult</Radio.Button>
              <Radio.Button value="extreme">Extreme</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <TagInput
            onChange={this.handleTagChange.bind(this)}
            defaultValue={data.tags}
            defaultTags={this.props.defaultData!.tags}
            label="Tags"
            tagOptions={{
              minTags: 3
            }}
          />
          <DescriptionInput
            defaultValue={data.description}
            onChange={this.handleDescriptionChange.bind(this)}
            label="Description"
            overwriteDescriptionValue={_.get(this.props.defaultData, 'description.value')}
          />
          <Form.Item>
            <div className="flex">
              <div className="w-1/2">
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
                    checked={data.useThumbnail}
                    onChange={this.handleCheckboxChange.bind(this, 'useThumbnail')}
                  >
                    Use thumbnail (if provided)
                  </Checkbox>
                </div>
              </div>
              <div className="w-1/2">
                <Form.Item label="Source URL">
                  <Input
                    value={data.source || ''}
                    onChange={this.handleChange.bind(this, 'source')}
                  />
                </Form.Item>
              </div>
            </div>
          </Form.Item>
        </div>
      </div>
    );
  }
}
