import React from 'react';
import * as _ from 'lodash';
import { inject, observer } from 'mobx-react';
import { SubmissionStore } from '../../../stores/submission.store';
import { SubmissionPackage } from 'postybirb-commons';
import { Select, Avatar, Button, Divider } from 'antd';
import { SubmissionType } from 'postybirb-commons';
import { FileSubmission } from 'postybirb-commons';
import SubmissionUtil from '../../../utils/submission.util';

interface Props {
  className?: string;
  ignoreId?: string;
  ignorePosting?: boolean;
  ignoreScheduled?: boolean;
  label?: string;
  multiple?: boolean;
  onSelect: (submissions: SubmissionPackage<any>[]) => void;
  selectAll?: boolean;
  selected: string[];
  submissionStore?: SubmissionStore;
  submissionType: string;
  validOnly?: boolean;
}

@inject('submissionStore')
@observer
export default class SubmissionSelect extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
    if (props.selectAll) {
      this.onChange(this.getSubmissions(props).map(s => s.submission._id));
    }
  }

  getSubmissions(props: Props) {
    let submissions = props
      .submissionStore!.all.filter(s => s.submission.type === props.submissionType)
      .filter(s => s.submission._id !== props.ignoreId);

    if (props.validOnly) {
      submissions = submissions.filter(s => SubmissionUtil.getProblemCount(s.problems) === 0);
    }

    if (props.ignorePosting) {
      submissions = submissions
        .filter(s => !s.submission.isPosting)
        .filter(s => !s.submission.isQueued);
    }

    if (props.ignoreScheduled) {
      submissions = submissions.filter(s => !s.submission.schedule.isScheduled);
    }

    return submissions;
  }

  onChange(ids: string[]) {
    this.props.onSelect(
      _.cloneDeep(this.props.submissionStore!.all.filter(s => ids.includes(s.submission._id)))
    );
  }

  render() {
    const submissions = this.getSubmissions(this.props);

    return (
      <>
        <Select
          allowClear={this.props.multiple}
          className={this.props.className}
          value={this.props.selected}
          mode={this.props.multiple ? 'multiple' : 'default'}
          onChange={this.onChange.bind(this)}
        >
          {submissions.map(s => (
            <Select.Option value={s.submission._id}>
              <span className="mr-2">
                {this.props.submissionType === SubmissionType.FILE ? (
                  <Avatar src={(s.submission as FileSubmission).primary.preview} shape="square" />
                ) : (
                  <Avatar icon="notification" shape="square" />
                )}
              </span>
              {SubmissionUtil.getSubmissionTitle(s)}
            </Select.Option>
          ))}
        </Select>
        {this.props.multiple ? (
          <>
            <Button
              type="link"
              onClick={() => this.onChange(submissions.map(s => s.submission._id))}
            >
              Select All
            </Button>
            <Divider type="vertical" />
            <Button type="link" color="w" onClick={() => this.onChange([])}>
              Deselect All
            </Button>
          </>
        ) : null}
      </>
    );
  }
}
