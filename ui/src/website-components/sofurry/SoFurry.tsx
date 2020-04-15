import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { SoFurryOptions } from '../../../../electron-app/src/websites/so-furry/so-furry.interface';
import TagInput from '../../views/submissions/submission-forms/form-components/TagInput';
import DescriptionInput from '../../views/submissions/submission-forms/form-components/DescriptionInput';
import { SubmissionPart } from '../../../../electron-app/src/submission/submission-part/interfaces/submission-part.interface';
import { Folder } from '../../../../electron-app/src/websites/interfaces/folder.interface';
import { Form, Input, Radio, Checkbox, Select } from 'antd';
import WebsiteService from '../../services/website.service';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { Submission } from '../../../../electron-app/src/submission/interfaces/submission.interface';
import GenericSubmissionSection from '../generic/GenericSubmissionSection';
import { DefaultOptions } from '../../../../electron-app/src/submission/submission-part/interfaces/default-options.interface';
import SectionProblems from '../../views/submissions/submission-forms/form-sections/SectionProblems';

const defaultOptions: SoFurryOptions = {
  title: undefined,
  useThumbnail: true,
  autoScale: true,
  folder: '0',
  viewOptions: '0',
  thumbnailAsCoverArt: false,
  rating: null,
  tags: {
    extendDefault: true,
    value: []
  },
  description: {
    overwriteDefault: false,
    value: ''
  }
};

export class SoFurry implements Website {
  internalName: string = 'SoFurry';
  name: string = 'SoFurry';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://www.sofurry.com/user/login" {...props} />
  );

  FileSubmissionForm = (props: SubmissionSectionProps<FileSubmission, SoFurryOptions>) => (
    <SoFurryFileSubmissionForm key={props.part.accountId} {...props} />
  );

  NotificationSubmissionForm = (props: SubmissionSectionProps<Submission, SoFurryOptions>) => (
    <SoFurryFileSubmissionForm key={props.part.accountId} {...props} />
  );

  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }

  supportsTextType(type: string): boolean {
    return ['text/plain'].includes(type);
  }
}

interface SoFurryFileSubmissionState {
  folders: Folder[];
}

export class SoFurryFileSubmissionForm extends React.Component<
  SubmissionSectionProps<Submission, SoFurryOptions>,
  SoFurryFileSubmissionState
> {
  state: SoFurryFileSubmissionState = {
    folders: []
  };

  constructor(props: SubmissionSectionProps<FileSubmission, SoFurryOptions>) {
    super(props);
    this.state = {
      folders: []
    };

    // Not sure if I should move this call elsewhere
    WebsiteService.getAccountInformation(this.props.part.website, this.props.part.accountId).then(
      ({ data }) => {
        if (data.folders) {
          if (!_.isEqual(this.state.folders, data.folders)) {
            this.setState({ folders: data.folders });
          }
        }
      }
    );
  }

  handleChange(fieldName: string, { target }) {
    const part: SubmissionPart<SoFurryOptions> = _.cloneDeep(this.props.part);
    part.data[fieldName] = target.value;
    this.props.onUpdate(part);
  }

  handleTagChange(update: any) {
    const part: SubmissionPart<SoFurryOptions> = _.cloneDeep(this.props.part);
    part.data.tags = update;
    this.props.onUpdate(part);
  }

  handleDescriptionChange(update) {
    const part: SubmissionPart<SoFurryOptions> = _.cloneDeep(this.props.part);
    part.data.description = update;
    this.props.onUpdate(part);
  }

  handleSelectChange(fieldName: string, value: any) {
    const part: SubmissionPart<SoFurryOptions> = _.cloneDeep(this.props.part);
    part.data[fieldName] = value;
    this.props.onUpdate(part);
  }

  handleCheckboxChange(fieldName: string, { target }) {
    const part: SubmissionPart<SoFurryOptions> = _.cloneDeep(this.props.part);
    part.data[fieldName] = target.checked;
    this.props.onUpdate(part);
  }

  isFileSubmission(submission: any): submission is FileSubmission {
    return !!submission.primary;
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
              <Radio.Button value="general">All Ages</Radio.Button>
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
              minTags: 2
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
              {this.isFileSubmission(this.props.submission) ? (
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
                  <div>
                    <Checkbox
                      checked={data.thumbnailAsCoverArt}
                      onChange={this.handleCheckboxChange.bind(this, 'thumbnailAsCoverArt')}
                    >
                      Use Thumbnail as cover art
                    </Checkbox>
                  </div>
                </div>
              ) : null}
              <div className="w-1/2">
                <Form.Item label="Folder">
                  <Select
                    style={{ width: '100%' }}
                    value={data.folder}
                    onSelect={this.handleSelectChange.bind(this, 'folder')}
                  >
                    {this.state.folders.map(f => (
                      <Select.Option value={f.id}>{f.title}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </div>
          </Form.Item>
        </div>
      </div>
    );
  }
}
