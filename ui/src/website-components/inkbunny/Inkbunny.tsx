import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import TagInput from '../../views/submissions/submission-forms/form-components/TagInput';
import DescriptionInput from '../../views/submissions/submission-forms/form-components/DescriptionInput';
import { SubmissionPart } from '../../../../electron-app/src/submission/submission-part/interfaces/submission-part.interface';
import { Form, Input, Checkbox, Select, Radio } from 'antd';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import SectionProblems from '../../views/submissions/submission-forms/form-sections/SectionProblems';
import { InkbunnyOptions } from '../../../../electron-app/src/websites/inkbunny/inkbunny.interface';
import InkbunnyLogin from './InkbunnyLogin';

const defaultOptions: InkbunnyOptions = {
  blockGuests: false,
  friendsOnly: false,
  notify: true,
  scraps: false,
  submissionType: undefined,
  rating: null,
  useThumbnail: true,
  autoScale: true,
  tags: {
    extendDefault: true,
    value: []
  },
  description: {
    overwriteDefault: false,
    value: ''
  }
};

export class Inkbunny implements Website {
  internalName: string = 'Inkbunny';
  name: string = 'Inkbunny';
  supportsAdditionalFiles: boolean = true;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => <InkbunnyLogin {...props} />;

  FileSubmissionForm = (props: SubmissionSectionProps<FileSubmission, InkbunnyOptions>) => (
    <InkbunnyFileSubmissionForm key={props.part.accountId} {...props} />
  );

  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }
}

export class InkbunnyFileSubmissionForm extends React.Component<
  SubmissionSectionProps<FileSubmission, InkbunnyOptions>
> {
  handleChange(fieldName: string, { target }) {
    const part: SubmissionPart<InkbunnyOptions> = _.cloneDeep(this.props.part);
    part.data[fieldName] = target.value;
    this.props.onUpdate(part);
  }

  handleTagChange(update: any) {
    const part: SubmissionPart<InkbunnyOptions> = _.cloneDeep(this.props.part);
    part.data.tags = update;
    this.props.onUpdate(part);
  }

  handleDescriptionChange(update) {
    const part: SubmissionPart<InkbunnyOptions> = _.cloneDeep(this.props.part);
    part.data.description = update;
    this.props.onUpdate(part);
  }

  handleSelectChange(fieldName: string, value: any) {
    const part: SubmissionPart<InkbunnyOptions> = _.cloneDeep(this.props.part);
    part.data[fieldName] = value;
    this.props.onUpdate(part);
  }

  handleCheckboxChange(fieldName: string, { target }) {
    const part: SubmissionPart<InkbunnyOptions> = _.cloneDeep(this.props.part);
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
            tagOptions={{
              minTags: 4
            }}
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
              <Radio.Button value="2">Nudity - Nonsexual</Radio.Button>
              <Radio.Button value="3">Violence - Mild</Radio.Button>
              <Radio.Button value="4">Sexual Themes - Erotic</Radio.Button>
              <Radio.Button value="5">Strong Violence</Radio.Button>
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
                    checked={data.blockGuests}
                    onChange={this.handleCheckboxChange.bind(this, 'blockGuests')}
                  >
                    Block Guests
                  </Checkbox>
                </div>
                <div>
                  <Checkbox
                    checked={data.friendsOnly}
                    onChange={this.handleCheckboxChange.bind(this, 'friendsOnly')}
                  >
                    Friends Only
                  </Checkbox>
                </div>
                <div>
                  <Checkbox
                    checked={data.notify}
                    onChange={this.handleCheckboxChange.bind(this, 'notify')}
                  >
                    Notify Watchers
                  </Checkbox>
                </div>
                <div>
                  <Checkbox
                    checked={data.scraps}
                    onChange={this.handleCheckboxChange.bind(this, 'scraps')}
                  >
                    Send to scraps
                  </Checkbox>
                </div>
              </div>
              <div className="w-1/2">
                <Form.Item label="Category">
                  <Select
                    style={{ width: '100%' }}
                    value={data.submissionType}
                    onSelect={this.handleSelectChange.bind(this, 'submissionType')}
                  >
                    <Select.Option value="1">Picture/Pinup</Select.Option>
                    <Select.Option value="2">Sketch</Select.Option>
                    <Select.Option value="3">Picture Series</Select.Option>
                    <Select.Option value="4">Comic</Select.Option>
                    <Select.Option value="5">Portfolio</Select.Option>
                    <Select.Option value="6">Shoockwave/Flash - Animation</Select.Option>
                    <Select.Option value="7">Shockwave/Flash - Interactive</Select.Option>
                    <Select.Option value="8">Video - Feature Length</Select.Option>
                    <Select.Option value="9">Video - Animation/3D/CGI</Select.Option>
                    <Select.Option value="10">Music - Single Track</Select.Option>
                    <Select.Option value="11">Music - Album</Select.Option>
                    <Select.Option value="12">Writing - Document</Select.Option>
                    <Select.Option value="13">Character Sheet</Select.Option>
                    <Select.Option value="14">
                      Photography - Fursuit/Sculpture/Jewelry/etc
                    </Select.Option>
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
