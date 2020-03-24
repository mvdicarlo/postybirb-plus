import React from 'react';
import _ from 'lodash';
import { inject, observer } from 'mobx-react';
import { Form, Select } from 'antd';
import { SubmissionPart } from '../../../../../electron-app/src/submission/submission-part/interfaces/submission-part.interface';
import { SubmissionType } from '../../../shared/enums/submission-type.enum';
import { SubmissionStore } from '../../../stores/submission.store';
import { SubmissionTemplateStore } from '../../../stores/submission-template.store';
import SubmissionUtil from '../../../utils/submission.util';
import { LabeledValue } from 'antd/lib/select';

type TemplateType = 'TEMPLATE' | 'SUBMISSION';

interface Props {
  ignoreId?: string;
  label?: string;
  onSelect: (id: string, type: TemplateType, parts: Record<string, SubmissionPart<any>>) => void;
  showSubmissions?: boolean;
  showTemplates?: boolean;
  submissionStore?: SubmissionStore;
  submissionTemplateStore?: SubmissionTemplateStore;
  submissionType: SubmissionType;
}

@inject('submissionStore', 'submissionTemplateStore')
@observer
export default class SubmissionTemplateSelect extends React.Component<Props> {

  showSubmissions(): boolean {
    return this.props.showSubmissions !== false;
  }

  showTemplates(): boolean {
    return this.props.showTemplates !== false;
  }

  getPlaceholder() {
    const templates = this.showTemplates();
    const submissions = this.showSubmissions();
    if (templates && submissions) {
      return 'Select a template or submission';
    } else if (templates) {
      return 'Select a template';
    } else {
      return 'Select a submission';
    }
  }

  getSubmissionRecords() {
    return this.props
      .submissionStore!.all.filter(r => r.submission.type === this.props.submissionType)
      .filter(r => r.submission._id !== this.props.ignoreId);
  }

  getTemplateRecords() {
    return this.props.submissionTemplateStore!.all.filter(
      r => r.type === this.props.submissionType
    );
  }

  createOptGroup(label: string, type: TemplateType, records: { value: string; label: string }[]) {
    return (
      <Select.OptGroup key={label} label={label}>
        {records
        .sort((a, b) => a.label.localeCompare(b.label))
        .map(r => (
          <Select.Option key={r.value} value={`${type}:${r.value}`}>
            {r.label}
          </Select.Option>
        ))}
      </Select.OptGroup>
    );
  }

  getOptGroups() {
    const templates = this.showTemplates();
    const submissions = this.showSubmissions();

    const optGroups: JSX.Element[] = [];
    if (templates) {
      optGroups.push(
        this.createOptGroup(
          'Templates',
          'TEMPLATE',
          this.getTemplateRecords().map(r => ({ value: r._id, label: r.alias }))
        )
      );
    }

    if (submissions) {
      optGroups.push(
        this.createOptGroup(
          'Submissions',
          'SUBMISSION',
          this.getSubmissionRecords().map(r => ({
            value: r.submission._id,
            label: SubmissionUtil.getSubmissionTitle(r)
          }))
        )
      );
    }

    return optGroups;
  }

  handleSelect = (value: string | number | LabeledValue, option: React.ReactElement<any>) => {
    const [type, id] = value.toString().split(':');
    
    let parts: Record<string, SubmissionPart<any>> = {};
    switch (type as TemplateType) {
        case 'SUBMISSION':
            parts = this.props.submissionStore?.getSubmission(id)!.parts;
            break;
        case 'TEMPLATE':
            parts = this.props.submissionTemplateStore?.getSubmissionTemplate(id)!.parts;
            break;
    }

    this.props.onSelect(id, type as TemplateType, _.cloneDeep(parts));
  };

  render() {
    return (
      <Form.Item label={this.props.label || ''}>
        <Select allowClear={true} placeholder={this.getPlaceholder()} onSelect={this.handleSelect}>
          {this.getOptGroups()}
        </Select>
      </Form.Item>
    );
  }
}
