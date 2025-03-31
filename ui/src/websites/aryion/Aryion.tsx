import { Cascader, Checkbox, Form, Radio } from 'antd';
import _ from 'lodash';
import { AryionFileOptions, FileSubmission, Folder } from 'postybirb-commons';
import React from 'react';
import WebsiteService from '../../services/website.service';
import { SubmissionSectionProps } from '../../views/submissions/submission-forms/interfaces/submission-section.interface';
import { WebsiteSectionProps } from '../form-sections/website-form-section.interface';
import GenericFileSubmissionSection from '../generic/GenericFileSubmissionSection';
import { WebsiteImpl } from '../website.base';

export class Aryion extends WebsiteImpl {
  internalName: string = 'Aryion';
  name: string = 'Aryion';
  supportsAdditionalFiles: boolean = false;
  supportsTags: boolean = true;
  loginUrl: string = 'https://aryion.com/forum/ucp.php?mode=login';

  FileSubmissionForm = (props: WebsiteSectionProps<FileSubmission, AryionFileOptions>) => (
    <AryionFileSubmissionForm
      key={props.part.accountId}
      ratingOptions={{
        show: false
      }}
      {...props}
    />
  );

  supportsTextType(type: string): boolean {
    return ['text/plain', 'application/pdf', 'text/pdf'].includes(type);
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
