import React from 'react';
import _ from 'lodash';
import { inject, observer } from 'mobx-react';
import { LoginStatusStore } from '../../../../stores/login-status.store';
import { Modal, Button, Form, TreeSelect, Checkbox } from 'antd';
import { SubmissionPart } from '../../../../../../electron-app/src/submission/submission-part/interfaces/submission-part.interface';
import { TreeNode } from 'antd/lib/tree-select';
import { WebsiteRegistry } from '../../../../websites/website-registry';
import SubmissionTemplateSelect from '../../submission-template-select/SubmissionTemplateSelect';
import { SubmissionType } from '../../../../shared/enums/submission-type.enum';

interface Props {
  className?: string;
  ignoreId?: string;
  label?: string;
  loginStatusStore?: LoginStatusStore;
  onPropsSelect: (props: Array<SubmissionPart<any>>) => void;
  submissionType: SubmissionType;
}

interface State {
  keepTemplateTitle: boolean;
  modalOpen: boolean;
  selected?: { [key: string]: SubmissionPart<any> };
  selectedFields: string[];
}

@inject('loginStatusStore')
@observer
export default class ImportDataSelect extends React.Component<Props, State> {
  state: State = {
    keepTemplateTitle: false,
    modalOpen: false,
    selected: undefined,
    selectedFields: []
  };

  hideModal = () => {
    this.setState({
      modalOpen: false,
      selected: undefined,
      selectedFields: [],
      keepTemplateTitle: false
    });
  };

  showModal = () => this.setState({ modalOpen: true });

  handleComplete = () => {
    this.props.onPropsSelect(
      _.cloneDeep(
        Object.values(this.state.selected!)
          .filter(p => this.state.selectedFields.includes(p.accountId))
          .map(p => {
            if (!this.state.keepTemplateTitle) {
              delete p.data.title;
            }
            return p;
          })
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
            <SubmissionTemplateSelect
              submissionType={this.props.submissionType}
              ignoreId={this.props.ignoreId}
              label="Import From"
              onDeselect={() => this.setState({ selected: undefined, selectedFields: [] })}
              onSelect={(id, type, parts) => {
                this.setState({
                  selected: parts,
                  selectedFields: parts ? Object.values(parts).map(p => p.accountId) : []
                });
              }}
            />

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
            {this.state.selected ? (
              <Form.Item>
                <Checkbox
                  value={this.state.keepTemplateTitle}
                  onChange={e => this.setState({ keepTemplateTitle: e.target.checked })}
                >
                  Use title from import
                </Checkbox>
              </Form.Item>
            ) : null}
          </Form>
        </Modal>
      </div>
    );
  }
}
