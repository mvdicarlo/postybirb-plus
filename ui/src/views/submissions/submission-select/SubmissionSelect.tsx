import React from 'react';
import * as _ from 'lodash';
import { inject, observer } from 'mobx-react';
import { SubmissionStore } from '../../../stores/submission.store';
import { SubmissionPackage } from '../../../../../electron-app/src/submission/interfaces/submission-package.interface';
import { Select, Avatar } from 'antd';
import { SubmissionType } from '../../../shared/enums/submission-type.enum';
import { FileSubmission } from '../../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import SubmissionUtil from '../../../utils/submission.util';

interface Props {
  className?: string;
  ignoreId?: string;
  label?: string;
  multiple?: boolean;
  onSelect: (submissions: SubmissionPackage<any>[]) => void;
  selectAll?: boolean;
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
      let submissions = this.props
        .submissionStore!.all.filter(s => s.submission.type === this.props.submissionType)
        .filter(s => s.submission._id !== this.props.ignoreId);

      if (this.props.validOnly) {
        submissions = submissions.filter(s => SubmissionUtil.getProblemCount(s.problems) === 0);
      }
      
      this.onChange(submissions.map(s => s.submission._id));
    }
  }

  onChange(ids: string[]) {
    this.props.onSelect(
      _.cloneDeep(this.props.submissionStore!.all.filter(s => ids.includes(s.submission._id)))
    );
  }

  render() {
    let submissions = this.props
      .submissionStore!.all.filter(s => s.submission.type === this.props.submissionType)
      .filter(s => s.submission._id !== this.props.ignoreId);

    if (this.props.validOnly) {
      submissions = submissions.filter(s => SubmissionUtil.getProblemCount(s.problems) === 0);
    }

    return (
      <Select
        allowClear={this.props.multiple}
        className={this.props.className}
        defaultValue={this.props.selectAll ? submissions.map(s => s.submission._id) : []}
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
    );
  }
}
