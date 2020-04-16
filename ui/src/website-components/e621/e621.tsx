import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { e621Options } from '../../../../electron-app/src/websites/e621/e621.interface';
import TagInput from '../../views/submissions/submission-forms/form-components/TagInput';
import DescriptionInput from '../../views/submissions/submission-forms/form-components/DescriptionInput';
import { SubmissionPart } from '../../../../electron-app/src/submission/submission-part/interfaces/submission-part.interface';
import { Form, Input, Radio, Checkbox } from 'antd';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import SectionProblems from '../../views/submissions/submission-forms/form-sections/SectionProblems';
import E621Login from './e621Login';

const defaultOptions: e621Options = {
  title: undefined,
  useThumbnail: true,
  autoScale: true,
  rating: null,
  sources: [],
  parentId: undefined,
  tags: {
    extendDefault: true,
    value: []
  },
  description: {
    overwriteDefault: false,
    value: ''
  }
};

export class e621 implements Website {
  internalName: string = 'e621';
  name: string = 'e621';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => <E621Login {...props} />;

  FileSubmissionForm = (props: SubmissionSectionProps<FileSubmission, e621Options>) => (
    <E621FileSubmissionForm key={props.part.accountId} {...props} />
  );

  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }
}

export class E621FileSubmissionForm extends React.Component<
  SubmissionSectionProps<FileSubmission, e621Options>
> {
  handleChange(fieldName: string, { target }) {
    const part: SubmissionPart<e621Options> = _.cloneDeep(this.props.part);
    part.data[fieldName] = target.value;
    this.props.onUpdate(part);
  }

  handleTagChange(update: any) {
    const part: SubmissionPart<e621Options> = _.cloneDeep(this.props.part);
    part.data.tags = update;
    this.props.onUpdate(part);
  }

  handleDescriptionChange(update) {
    const part: SubmissionPart<e621Options> = _.cloneDeep(this.props.part);
    part.data.description = update;
    this.props.onUpdate(part);
  }

  handleSelectChange(fieldName: string, value: any) {
    const part: SubmissionPart<e621Options> = _.cloneDeep(this.props.part);
    part.data[fieldName] = value;
    this.props.onUpdate(part);
  }

  handleCheckboxChange(fieldName: string, { target }) {
    const part: SubmissionPart<e621Options> = _.cloneDeep(this.props.part);
    part.data[fieldName] = target.checked;
    this.props.onUpdate(part);
  }

  handleSourceChange(index: number, { target }) {
    const part: SubmissionPart<e621Options> = _.cloneDeep(this.props.part);
    part.data.sources[index] = target.value;
    this.props.onUpdate(part);
  }

  getSourceSection() {
    const sources: JSX.Element[] = [];
    const { data } = this.props.part;
    for (let i = 0; i < 5; i++) {
      sources.push(
        <Form.Item label={`Source ${i + 1}`}>
          <Input value={data.sources[i]} onChange={this.handleSourceChange.bind(this, i)} />
        </Form.Item>
      );
    }
    return sources;
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
              <Radio.Button value="general">Safe</Radio.Button>
              <Radio.Button value="mature">Questionable</Radio.Button>
              <Radio.Button value="adult">Explicit</Radio.Button>
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
              </div>
              <div className="w-1/2">
                <Form.Item label="Parent Id">
                  <Input onChange={this.handleChange.bind(this, 'parentId')} />
                </Form.Item>
                {this.getSourceSection()}
              </div>
            </div>
          </Form.Item>
        </div>
      </div>
    );
  }
}
