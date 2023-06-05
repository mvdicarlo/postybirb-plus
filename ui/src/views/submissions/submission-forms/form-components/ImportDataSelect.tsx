import React from 'react';
import _ from 'lodash';
import { inject, observer } from 'mobx-react';
import { LoginStatusStore } from '../../../../stores/login-status.store';
import { Modal, Button, Form, TreeSelect, Checkbox } from 'antd';
import { SubmissionPart } from 'postybirb-commons';
import { TreeNode } from 'antd/lib/tree-select';
import { WebsiteRegistry } from '../../../../websites/website-registry';
import SubmissionTemplateSelect from '../../submission-template-select/SubmissionTemplateSelect';
import { SubmissionType } from 'postybirb-commons';
import { DefaultOptions } from 'postybirb-commons';

interface Props {
  className?: string;
  ignoreId?: string;
  label?: string;
  loginStatusStore?: LoginStatusStore;
  onPropsSelect: (props: Array<SubmissionPart<any>>) => void;
  submissionType: SubmissionType;
  hideUseTemplateTitle?: boolean;
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

  sanitizeData = (parts: SubmissionPart<any>[]) => {
    return parts.map(p => {
      if (!p.data.title) {
        delete p.data.title;
      }
      if (!p.data.rating) {
        delete p.data.rating;
      }
      return p;
    });
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
      this.sanitizeData(
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

  shouldSelectPart = (part: SubmissionPart<any>): boolean => {
    // Don't pre-select the default section when it's empty. The user probably
    // doesn't want their defaults clobbered with nothingness.
    if (part.isDefault) {
      const defaultOptions: DefaultOptions = part.data;
      return !!(
        defaultOptions.title?.trim() ||
        defaultOptions.tags?.value?.length ||
        defaultOptions.description?.value?.trim() ||
        !_.isNil(defaultOptions.rating)
      );
    } else {
      return true;
    }
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
                  selectedFields: parts
                    ? Object.values(parts)
                        .filter(this.shouldSelectPart)
                        .map(p => p.accountId)
                    : []
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
            {!this.props.hideUseTemplateTitle && this.state.selected ? (
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
