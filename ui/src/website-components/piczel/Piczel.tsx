import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { PiczelOptions } from '../../../../electron-app/src/websites/piczel/piczel.interface';
import TagInput from '../../views/submissions/submission-forms/form-components/TagInput';
import DescriptionInput from '../../views/submissions/submission-forms/form-components/DescriptionInput';
import { SubmissionPart } from '../../../../electron-app/src/submission/submission-part/interfaces/submission-part.interface';
import { Folder } from '../../../../electron-app/src/websites/interfaces/folder.interface';
import { Form, Input, Checkbox, Select, Radio } from 'antd';
import WebsiteService from '../../services/website.service';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import SectionProblems from '../../views/submissions/submission-forms/form-sections/SectionProblems';

const defaultOptions: PiczelOptions = {
  title: undefined,
  useThumbnail: true,
  autoScale: true,
  folder: null,
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

export class Piczel implements Website {
  internalName: string = 'Piczel';
  name: string = 'Piczel';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://piczel.tv/login" {...props} />
  );

  FileSubmissionForm = (props: SubmissionSectionProps<FileSubmission, PiczelOptions>) => (
    <PiczelFileSubmissionForm key={props.part.accountId} {...props} />
  );

  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }
}

interface PiczelFileSubmissionState {
  folders: Folder[];
}

export class PiczelFileSubmissionForm extends React.Component<
  SubmissionSectionProps<FileSubmission, PiczelOptions>,
  PiczelFileSubmissionState
> {
  state: PiczelFileSubmissionState = {
    folders: []
  };

  constructor(props: SubmissionSectionProps<FileSubmission, PiczelOptions>) {
    super(props);
    this.state = {
      folders: []
    };

    // Not sure if I should move this call elsewhere
    WebsiteService.getAccountFolders(this.props.part.website, this.props.part.accountId).then(
      ({ data }) => {
        if (data && data.length) {
          if (!_.isEqual(this.state.folders, data)) {
            this.setState({ folders: data });
          }
        }
      }
    );
  }

  handleChange(fieldName: string, { target }) {
    const part: SubmissionPart<PiczelOptions> = _.cloneDeep(this.props.part);
    part.data[fieldName] = target.value;
    this.props.onUpdate(part);
  }

  handleTagChange(update: any) {
    const part: SubmissionPart<PiczelOptions> = _.cloneDeep(this.props.part);
    part.data.tags = update;
    this.props.onUpdate(part);
  }

  handleDescriptionChange(update) {
    const part: SubmissionPart<PiczelOptions> = _.cloneDeep(this.props.part);
    part.data.description = update;
    this.props.onUpdate(part);
  }

  handleSelectChange(fieldName: string, value: any) {
    const part: SubmissionPart<PiczelOptions> = _.cloneDeep(this.props.part);
    part.data[fieldName] = value;
    this.props.onUpdate(part);
  }

  handleCheckboxChange(fieldName: string, { target }) {
    const part: SubmissionPart<PiczelOptions> = _.cloneDeep(this.props.part);
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
          <Form.Item label="Rating">
            <Radio.Group
              onChange={this.handleChange.bind(this, 'rating')}
              value={data.rating}
              buttonStyle="solid"
            >
              <Radio.Button value={null}>Default</Radio.Button>
              <Radio.Button value="adult">NSFW</Radio.Button>
            </Radio.Group>
          </Form.Item>
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
              </div>
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
