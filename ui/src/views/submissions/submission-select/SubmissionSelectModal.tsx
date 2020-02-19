import React from 'react';
import SubmissionSelect from './SubmissionSelect';
import { Modal } from 'antd';
import { SubmissionPackage } from '../../../../../electron-app/src/submission/interfaces/submission-package.interface';
import { SubmissionType } from '../../../shared/enums/submission-type.enum';

interface Props {
  below?: JSX.Element;
  label?: string;
  multiple?: boolean;
  onClose: () => void;
  onOk: (submissions: SubmissionPackage<any>[]) => void;
  selectAll?: boolean;
  submissionType: SubmissionType;
  title: string;
  validOnly?: boolean;
  visible: boolean;
}

interface State {
  selected: SubmissionPackage<any>[];
}

export default class SubmissionSelectModal extends React.Component<Props, State> {
  state: State = {
    selected: []
  };

  render() {
    return (
      <Modal
        destroyOnClose={true}
        okButtonProps={{ disabled: !this.state.selected.length }}
        onCancel={this.props.onClose}
        onOk={() => this.props.onOk(this.state.selected)}
        title={this.props.title}
        visible={this.props.visible}
      >
        <div>
          {this.props.children ? <div className="mb-2">{this.props.children}</div> : null}
          <SubmissionSelect
            className="w-full"
            multiple={this.props.multiple}
            onSelect={selected => this.setState({ selected })}
            selectAll={this.props.selectAll}
            submissionType={this.props.submissionType}
            validOnly={this.props.validOnly || false}
            label={this.props.label}
          />
          {this.props.below ? <div className="mt-2">{this.props.below}</div> : null}
        </div>
      </Modal>
    );
  }
}
