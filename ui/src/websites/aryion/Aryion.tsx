import React from 'react';
import _ from 'lodash';
import { Website, LoginDialogProps } from '../interfaces/website.interface';
import { GenericLoginDialog } from '../generic/GenericLoginDialog';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { AryionFileOptions } from '../../../../electron-app/src/websites/aryion/aryion.interface';
import { Folder } from '../../../../electron-app/src/websites/interfaces/folder.interface';
import { Form, Checkbox, Radio, Cascader } from 'antd';
import WebsiteService from '../../services/website.service';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { GenericDefaultFileOptions } from '../../shared/objects/generic-default-file-options';

const defaultOptions: AryionFileOptions = {
  ...GenericDefaultFileOptions,
  folder: [],
  viewPermissions: 'ALL',
  commentPermissions: 'USER',
  tagPermissions: 'USER',
  requiredTag: undefined,
  scraps: false
};

export class Aryion implements Website {
  internalName: string = 'Aryion';
  name: string = 'Aryion';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  LoginDialog = (props: LoginDialogProps) => (
    <GenericLoginDialog url="https://aryion.com/forum/ucp.php?mode=login" {...props} />
  );

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, AryionFileOptions>) => (
    <AryionFileSubmissionForm
      key={props.part.accountId}
      ratingOptions={{
        show: false
      }}
      {...props}
    />
  );

  getDefaults() {
    return _.cloneDeep(defaultOptions);
  }

  supportsTextType(type: string): boolean {
    return ['text/plain'].includes(type);
  }
}

interface AryionSubmissionState {
  folders: Folder[];
}

export class AryionFileSubmissionForm extends GenericFileSubmissionSection<AryionFileOptions> {
  state: AryionSubmissionState = {
    folders: []
  };

  constructor(props: SubmissionSectionProps<FileSubmission, AryionFileOptions>) {
    super(props);
    this.state = {
      folders: []
    };

    WebsiteService.getAccountFolders(this.props.part.website, this.props.part.accountId).then(
      ({ data }) => {
        if (data) {
          if (!_.isEqual(this.state.folders, data)) {
            this.setState({ folders: data });
          }
        }
      }
    );
  }

  renderWideForm(data: AryionFileOptions) {
    const elements = super.renderWideForm(data);
    elements.push(
      <Form.Item label="Required Tag" required>
        <Radio.Group
          onChange={this.handleValueChange.bind(this, 'requiredTag')}
          value={data.requiredTag}
          buttonStyle="solid"
        >
          <Radio.Button value="0">Vore</Radio.Button>
          <Radio.Button value="1">Non-Vore</Radio.Button>
        </Radio.Group>
      </Form.Item>,
      <Form.Item label="View Permissions">
        <Radio.Group
          onChange={this.handleValueChange.bind(this, 'viewPermissions')}
          value={data.viewPermissions}
          buttonStyle="solid"
        >
          <Radio.Button value="ALL">Everyone</Radio.Button>
          <Radio.Button value="USER">Registered Users</Radio.Button>
          <Radio.Button value="SELF">Self Only</Radio.Button>
        </Radio.Group>
      </Form.Item>,
      <Form.Item label="Comment Permissions">
        <Radio.Group
          onChange={this.handleValueChange.bind(this, 'commentPermissions')}
          value={data.commentPermissions}
          buttonStyle="solid"
        >
          <Radio.Button value="USER">Registered Users</Radio.Button>
          <Radio.Button value="BLACK">All But Blocked</Radio.Button>
          <Radio.Button value="WHITE">Friends Only</Radio.Button>
          <Radio.Button value="SELF">Self Only</Radio.Button>
          <Radio.Button value="NONE">Nobody</Radio.Button>
        </Radio.Group>
      </Form.Item>,
      <Form.Item label="Tag Permissions">
        <Radio.Group
          onChange={this.handleValueChange.bind(this, 'tagPermissions')}
          value={data.tagPermissions}
          buttonStyle="solid"
        >
          <Radio.Button value="USER">Registered Users</Radio.Button>
          <Radio.Button value="BLACK">All But Blocked</Radio.Button>
          <Radio.Button value="WHITE">Friends Only</Radio.Button>
          <Radio.Button value="SELF">Self Only</Radio.Button>
        </Radio.Group>
      </Form.Item>
    );
    return elements;
  }

  renderRightForm(data: AryionFileOptions) {
    const elements = super.renderRightForm(data);
    elements.push(
      <Form.Item label="Folder" required>
        <Cascader
          changeOnSelect
          value={data.folder}
          options={this.state.folders}
          onChange={this.setValue.bind(this, 'folder')}
        />
      </Form.Item>
    );
    return elements;
  }

  renderLeftForm(data: AryionFileOptions) {
    const elements = super.renderLeftForm(data);
    elements.push(
      <div>
        <Checkbox checked={data.scraps} onChange={this.handleCheckedChange.bind(this, 'scraps')}>
          Send to scraps
        </Checkbox>
      </div>
    );
    return elements;
  }
}
