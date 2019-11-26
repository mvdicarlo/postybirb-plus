import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { FileSubmissionSectionProps } from '../../views/submissions/interfaces/file-submission-section.interface';
import { DefaultWeasylSubmissionOptions } from '../../../../electron-app/src/websites/weasyl/weasyl.interface';
import TagInput from '../../views/submissions/form-components/TagInput';
import DescriptionInput from '../../views/submissions/form-components/DescriptionInput';
import { SubmissionPart } from '../../../../electron-app/src/submission/interfaces/submission-part.interface';
import { Alert, Form, Input, Radio } from 'antd';

const defaultOptions: DefaultWeasylSubmissionOptions = {
  title: undefined,
  notify: true,
  critique: false,
  folder: null,
  category: null,
  tags: {
    extendDefault: true,
    value: []
  },
  description: {
    overwriteDefault: false,
    value: ''
  },
  rating: null
};

export class Weasyl implements Website {
  name: string = 'Weasyl';
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://www.weasyl.com/signin" {...props} />
  );

  FileSubmissionForm = (props: FileSubmissionSectionProps<any>) => (
    <WeasylFileSubmissionForm key={props.part.accountId} {...props} />
  );

  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }
}

interface WeasylFileSubmissionState {
  problems: string[];
}

export class WeasylFileSubmissionForm extends React.Component<
  FileSubmissionSectionProps<DefaultWeasylSubmissionOptions>,
  WeasylFileSubmissionState
> {
  state: WeasylFileSubmissionState = {
    problems: []
  };

  private readonly defaultOptions: DefaultWeasylSubmissionOptions = _.cloneDeep(defaultOptions);

  constructor(props: FileSubmissionSectionProps<DefaultWeasylSubmissionOptions>) {
    super(props);
    this.state = {
      problems: props.problems || []
    };
  }

  handleChange(fieldName: string, { target }) {
    const part: SubmissionPart<DefaultWeasylSubmissionOptions> = _.cloneDeep(this.props.part);
    part.data[fieldName] = target.value;
    this.props.onUpdate(part);
  }

  handleTagChange(update: any) {
    const part: SubmissionPart<DefaultWeasylSubmissionOptions> = _.cloneDeep(this.props.part);
    part.data.tags = update;
    this.props.onUpdate(part);
  }

  handleDescriptionChange(update) {
    const part: SubmissionPart<DefaultWeasylSubmissionOptions> = _.cloneDeep(this.props.part);
    part.data.description = update;
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
        <div>
          <Form.Item label="Title">
            <Input placeholder="Using default" defaultValue={data.title} onBlur={this.handleChange.bind(this, 'title')} />
          </Form.Item>
          <Form.Item label="Rating">
            <Radio.Group
              onChange={this.handleChange.bind(this, 'rating')}
              defaultValue={data.rating}
              buttonStyle="solid"
            >
              <Radio.Button value={null}>Default</Radio.Button>
              <Radio.Button value="10">General</Radio.Button>
              <Radio.Button value="30">Mature (18+ non-sexual)</Radio.Button>
              <Radio.Button value="40">Explicit (18+ sexual)</Radio.Button>
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
          />
        </div>
      </div>
    );
  }
}
