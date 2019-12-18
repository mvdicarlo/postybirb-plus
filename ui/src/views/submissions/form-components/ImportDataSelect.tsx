import React from 'react';
import _ from 'lodash';
import { inject, observer } from 'mobx-react';
import { LoginStatusStore } from '../../../stores/login-status.store';
import { SubmissionStore } from '../../../stores/submission.store';
import { Modal, Select, Button, Form, TreeSelect } from 'antd';
import { SubmissionPart } from '../../../../../electron-app/src/submission/interfaces/submission-part.interface';
import { SubmissionPackage } from '../../../../../electron-app/src/submission/interfaces/submission-package.interface';
import { TreeNode } from 'antd/lib/tree-select';
import { WebsiteRegistry } from '../../../website-components/website-registry';
import SubmissionUtil from '../../../utils/submission.util';
import { SubmissionTemplateStore } from '../../../stores/submission-template.store';

interface Props {
  className?: string;
  ignoreId?: string;
  label?: string;
  loginStatusStore?: LoginStatusStore;
  onPropsSelect: (props: Array<SubmissionPart<any>>) => void;
  submissionStore?: SubmissionStore;
  submissionTemplateStore?: SubmissionTemplateStore;
  submissionType: string;
}

interface State {
  modalOpen: boolean;
  selected?: { [key: string]: SubmissionPart<any> };
  selectedFields: string[];
}

@inject('loginStatusStore', 'submissionStore', 'submissionTemplateStore')
@observer
export default class ImportDataSelect extends React.Component<Props, State> {
  state: State = {
    modalOpen: false,
    selected: undefined,
    selectedFields: []
  };

  hideModal = () => {
    this.setState({ modalOpen: false, selected: undefined, selectedFields: [] });
  };

  showModal = () => this.setState({ modalOpen: true });

  handleComplete = () => {
    this.props.onPropsSelect(
      _.cloneDeep(
        Object.values(this.state.selected!).filter(p =>
          this.state.selectedFields.includes(p.accountId)
        )
      )
    );
    this.hideModal();
  };

  getFieldTree = (): TreeNode[] => {
    if (this.state.selected) {
      return Object.values(this.state.selected).map(p => {
        if (p.isDefault) {
          return {
            title: 'Default',
            value: p.accountId,
            key: p.accountId
          };
        } else {
          return {
            title: `${
              WebsiteRegistry.websites[p.website].name
            }: ${this.props.loginStatusStore!.getAliasForAccountId(p.accountId)}`,
            value: p.accountId,
            key: p.accountId
          };
        }
      });
    }

    return [];
  };

  findById(id: string | number): { [key: string]: SubmissionPart<any> } | undefined {
    const foundTemplate = this.props.submissionTemplateStore!.all.find(t => t.id === id);
    if (foundTemplate) {
      return foundTemplate.parts;
    }

    const foundSubmission = this.props.submissionStore!.all.find(s => s.submission.id === id);
    if (foundSubmission) {
      return foundSubmission.parts;
    }
  }

  render() {
    const title = this.props.label || 'Import';
    return (
      <div className={`inline ${this.props.className || ''}`}>
        <Button type="default" onClick={this.showModal}>
          {title}
        </Button>

        <Modal
          destroyOnClose={true}
          okButtonProps={{ disabled: !this.state.selectedFields.length }}
          okText="Import"
          onCancel={this.hideModal}
          onOk={this.handleComplete}
          title={title}
          visible={this.state.modalOpen}
        >
          <Form layout="vertical">
            <Form.Item label="Import From">
              <Select
                onSelect={(value: any) => {
                  const parts = this.findById(value);
                  this.setState({
                    selected: parts,
                    selectedFields: parts ? Object.values(parts).map(p => p.accountId) : []
                  });
                }}
              >
                <Select.OptGroup label="Templates">
                  {_.sortBy(
                    this.props.submissionTemplateStore!.all.filter(
                      t => t.type === this.props.submissionType
                    ),
                    'alias'
                  ).map(t => (
                    <Select.Option value={t.id}>{t.alias}</Select.Option>
                  ))}
                </Select.OptGroup>
                <Select.OptGroup label="Submissions">
                  {_.sortBy(
                    this.props.submissionStore!.all.filter(
                      s =>
                        s.submission.id !== this.props.ignoreId &&
                        s.submission.type === this.props.submissionType
                    ),
                    s => SubmissionUtil.getSubmissionTitle(s)
                  ).map(s => (
                    <Select.Option value={s.submission.id}>
                      {SubmissionUtil.getSubmissionTitle(s)}
                    </Select.Option>
                  ))}
                </Select.OptGroup>
              </Select>
            </Form.Item>

            <Form.Item label="Sections To Import">
              <TreeSelect
                allowClear={true}
                disabled={!this.state.selected}
                multiple={true}
                onChange={value => this.setState({ selectedFields: value })}
                className="w-full"
                treeCheckable={true}
                treeData={this.getFieldTree()}
                treeDefaultExpandAll={true}
                value={this.state.selectedFields}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }
}
