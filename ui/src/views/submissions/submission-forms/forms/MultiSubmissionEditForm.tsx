import React from 'react';
import _ from 'lodash';
import { WebsiteRegistry } from '../../../../websites/website-registry';
import DefaultFormSection from '../form-sections/DefaultFormSection';
import { LoginStatusStore } from '../../../../stores/login-status.store';
import { Match, withRouter, history } from 'react-router-dom';
import { headerStore } from '../../../../stores/header.store';
import { inject, observer } from 'mobx-react';
import { uiStore } from '../../../../stores/ui.store';
import { TreeNode } from 'antd/lib/tree-select';
import ImportDataSelect from '../form-components/ImportDataSelect';
import WebsiteSections from '../form-sections/WebsiteSections';
import { FormSubmissionPart } from '../interfaces/form-submission-part.interface';
import { SubmissionPart } from '../../../../../../electron-app/src/submission/submission-part/interfaces/submission-part.interface';
import { SubmissionType } from '../../../../shared/enums/submission-type.enum';
import SubmissionSelectModal from '../../submission-select/SubmissionSelectModal';
import { SubmissionPackage } from '../../../../../../electron-app/src/submission/interfaces/submission-package.interface';
import SubmissionService from '../../../../services/submission.service';
import SubmissionUtil from '../../../../utils/submission.util';
import { DefaultOptions } from '../../../../../../electron-app/src/submission/submission-part/interfaces/default-options.interface';
import {
  Form,
  Button,
  Typography,
  Spin,
  message,
  TreeSelect,
  Anchor,
  Popconfirm,
  Alert
} from 'antd';

interface Props {
  match: Match;
  loginStatusStore?: LoginStatusStore;
  history: history;
}

export interface MultiSubmissionEditFormState {
  parts: { [key: string]: FormSubmissionPart<any> };
  loading: boolean;
  touched: boolean;
  removedParts: string[];
  saveVisible: boolean;
}

@inject('loginStatusStore')
@observer
class MultiSubmissionEditForm extends React.Component<Props, MultiSubmissionEditFormState> {
  private original!: { [key: string]: FormSubmissionPart<any> };
  private headerSet: boolean = false;
  private submissionType: SubmissionType = SubmissionType.FILE;
  private defaultOptions: DefaultOptions = {
    tags: {
      extendDefault: false,
      value: []
    },
    description: {
      overwriteDefault: false,
      value: ''
    },
    rating: null,
    title: ''
  };

  state: MultiSubmissionEditFormState = {
    parts: {
      default: {
        data: this.defaultOptions,
        _id: 'default',
        accountId: 'default',
        submissionId: 'multi',
        website: 'default',
        isDefault: true,
        created: Date.now()
      }
    },
    loading: false,
    touched: false,
    removedParts: [],
    saveVisible: false
  };

  constructor(props: Props) {
    super(props);
    this.submissionType = props.match.params.id;
    this.original = _.cloneDeep(this.state.parts);
  }

  onUpdate = (updatePart: SubmissionPart<any> | Array<SubmissionPart<any>>) => {
    const parts = _.cloneDeep(this.state.parts);
    const updateParts = Array.isArray(updatePart) ? updatePart : [updatePart];
    updateParts.forEach(p => (parts[p.accountId] = p));
    const isTouched: boolean = !_.isEqual(parts, this.original);
    this.setState({ parts, touched: isTouched });
  };

  onSubmit = (selected: SubmissionPackage<any>[]) => {
    this.setState({ loading: true, saveVisible: false });
    const updatedParts = _.cloneDeep(this.state.parts);
    this.state.removedParts.forEach(accountId => delete updatedParts[accountId]);
    Promise.all(
      selected.map(submission =>
        SubmissionService.overwriteSubmissionParts({
          id: submission.submission._id,
          parts: Object.values(updatedParts)
        })
          .then(() => {
            message.success(
              `Successfully updated ${SubmissionUtil.getSubmissionTitle(submission)}.`
            );
          })
          .catch(() => {
            message.error(`Failed to update ${SubmissionUtil.getSubmissionTitle(submission)}.`);
          })
      )
    ).finally(() => this.setState({ loading: false, touched: false }));
  };

  importData(parts: Array<SubmissionPart<any>>) {
    parts.forEach(p => {
      const existing = Object.values(this.state.parts).find(part => part.accountId === p.accountId);
      p.submissionId = 'multi';
      if (existing) {
        p._id = existing._id;
      } else {
        p._id = `multi-${p.accountId}`;
      }
    });

    this.onUpdate(parts);
  }

  getWebsiteTreeData(): TreeNode[] {
    const websiteData: { [key: string]: TreeNode } = {};
    this.props
      .loginStatusStore!.statuses.filter(status => {
        const website = WebsiteRegistry.websites[status.website];
        if (this.submissionType === SubmissionType.FILE) {
          return true; // always can expect having a file form
        } else {
          // assume notification
          return !!website.NotificationSubmissionForm;
        }
      })
      .forEach(status => {
        const name = WebsiteRegistry.find(status.website)?.name;
        websiteData[status.website] = websiteData[status.website] || { children: [] };
        websiteData[status.website].title = <strong>{name}</strong>;
        websiteData[status.website].key = name;
        websiteData[status.website].value = status.website;
        (websiteData[status.website] as any).search = status.website.toLowerCase();
        (websiteData[status.website].children as any[]).push({
          key: status._id,
          value: status._id,
          title: (
            <span>
              <span className="select-tree-website-tag">[{name}]</span> {status.alias}
            </span>
          ),
          search: `${name} ${status.alias}`.toLowerCase(),
          isLeaf: true
        });
      });
    return Object.values(websiteData).sort((a, b) =>
      (a.key as string).localeCompare(b.key as string)
    );
  }

  getSelectedWebsiteIds(): string[] {
    return Object.values(this.state.parts)
      .filter(p => !p.isDefault)
      .filter(p => !this.state.removedParts.includes(p.accountId))
      .sort((a, b) => a.website.localeCompare(b.website))
      .map(p => p.accountId);
  }

  getSelectedWebsiteParts(): Array<SubmissionPart<any>> {
    return _.sortBy(
      Object.values(this.state.parts)
        .filter(p => !p.isDefault)
        .filter(p => !this.state.removedParts.includes(p.accountId)),
      'website'
    );
  }

  getSelectedWebsites(): string[] {
    const parts = this.getSelectedWebsiteParts();
    return Object.keys(_.groupBy(parts, 'website')).sort();
  }

  handleWebsiteSelect = (accountIds: string[]) => {
    const existingParts = Object.values(this.state.parts).map(p => p.accountId);
    const addedParts = accountIds.filter(id => !existingParts.includes(id));

    const removedParts = Object.values(this.state.parts)
      .filter(p => !p.isDefault)
      .map(p => p.accountId)
      .filter(id => !accountIds.includes(id));

    const parts = _.cloneDeep(this.state.parts);
    addedParts
      .filter(accountId => this.props.loginStatusStore!.accountExists(accountId))
      .forEach(accountId => {
        parts[accountId] = {
          accountId,
          submissionId: 'multi',
          _id: _.uniqueId('New Part'),
          website: this.props.loginStatusStore!.getWebsiteForAccountId(accountId),
          data: WebsiteRegistry.websites[
            this.props.loginStatusStore!.getWebsiteForAccountId(accountId)
          ].getDefaults(this.submissionType),
          isNew: true,
          created: Date.now()
        };
      });

    const isTouched: boolean = !_.isEqual(
      Object.values(parts).filter(p => !removedParts.includes(p.accountId)),
      Object.values(this.original)
    );

    this.setState({
      removedParts,
      parts,
      touched: isTouched
    });
  };

  handleNavClick = (
    e: React.MouseEvent<HTMLElement, MouseEvent>,
    link: {
      title: React.ReactNode;
      href: string;
    }
  ) => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById(link!.href)!.scrollIntoView({ behavior: 'smooth' });
  };

  isInViewport(elem: Element | null) {
    if (!elem) return false;
    const bounding = elem.getBoundingClientRect();
    return (
      bounding.top >= 0 &&
      bounding.left >= 0 &&
      bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  getHighestInViewport = (): string => {
    const anchorElements = document.getElementsByClassName('nav-section-anchor');
    if (anchorElements.length) {
      for (let i = 0; i <= anchorElements.length; i++) {
        const item = anchorElements.item(i);
        if (item && this.isInViewport(anchorElements.item(i))) {
          return item.id;
        }
      }

      return anchorElements.item(anchorElements.length - 1)!.id;
    }
    return '#Defaults';
  };

  componentWillUnmount() {
    uiStore.setPendingChanges(false);
  }

  formHasChanges(): boolean {
    return this.state.touched;
  }

  removeDeletedAccountParts() {
    const removed = Object.values(this.state.parts)
      .filter(p => !p.isDefault)
      .filter(p => !this.props.loginStatusStore!.accountExists(p.accountId));
    const copy = { ...this.state.parts };
    if (removed.length) {
      removed.forEach(p => {
        delete this.original[p.accountId];
        delete copy[p.accountId];
        this.setState({ parts: copy });
      });
    }
  }

  setHeaders() {
    if (this.headerSet) return;

    this.headerSet = true;
    const name = _.capitalize(this.props.match.params.id);
    headerStore.updateHeaderState({
      title: `Edit Multiple ${name} Submissions`,
      routes: [
        {
          path: `/${this.props.match.params.id}`,
          breadcrumbName: `${name} Submissions`
        },
        {
          path: `/edit/multiple-submissions/${this.props.match.params.id}`,
          breadcrumbName: 'Edit Multiple'
        }
      ]
    });
  }

  render() {
    if (!this.state.loading) {
      this.removeDeletedAccountParts();
      uiStore.setPendingChanges(this.formHasChanges());

      this.defaultOptions = this.state.parts.default.data;

      this.setHeaders();

      return (
        <div className="submission-form">
          <div className="flex">
            <Form layout="vertical" style={{ flex: 10 }}>
              <Form.Item className="form-section">
                <Typography.Title level={3}>
                  <span className="form-section-header nav-section-anchor" id="#Defaults">
                    Defaults
                  </span>
                </Typography.Title>
                <DefaultFormSection
                  part={this.state.parts.default}
                  onUpdate={this.onUpdate}
                  submission={{} as any}
                />
              </Form.Item>

              <Form.Item className="form-section">
                <Typography.Title level={3}>
                  <span className="form-section-header nav-section-anchor" id="#Websites">
                    Websites
                  </span>
                </Typography.Title>
                <TreeSelect
                  multiple
                  treeCheckable={true}
                  treeDefaultExpandAll={true}
                  treeNodeFilterProp="title"
                  allowClear={true}
                  value={this.getSelectedWebsiteIds()}
                  treeData={this.getWebsiteTreeData()}
                  onChange={this.handleWebsiteSelect}
                  filterTreeNode={(input, node) => node.props.search.includes(input.toLowerCase())}
                  placeholder="Select websites to post to"
                />
              </Form.Item>

              <WebsiteSections
                removedParts={this.state.removedParts}
                problems={{}}
                onUpdate={this.onUpdate.bind(this)}
                submissionType={this.submissionType}
                parts={this.state.parts}
              />
            </Form>

            <div className="ml-1" style={{ maxWidth: '125px' }}>
              <Anchor
                onClick={this.handleNavClick}
                getContainer={() => document.getElementById('primary-container') || window}
                getCurrentAnchor={this.getHighestInViewport}
              >
                <Anchor.Link title="Defaults" href="#Defaults" />
                <Anchor.Link title="Websites" href="#Websites" />
                {this.getSelectedWebsites().map(website => (
                  <Anchor.Link
                    title={<span>{WebsiteRegistry.websites[website].name}</span>}
                    href={`#${website}`}
                  />
                ))}
              </Anchor>
            </div>
          </div>
          <div className="form-action-bar">
            <ImportDataSelect
              className="mr-1"
              submissionType={this.submissionType}
              onPropsSelect={this.importData.bind(this)}
            />
            <Popconfirm
              title="Are you sure?."
              onConfirm={() =>
                this.setState({
                  parts: _.cloneDeep(this.original),
                  removedParts: [],
                  touched: false
                })
              }
            >
              <Button className="mr-1">New</Button>
            </Popconfirm>

            <Button onClick={() => this.setState({ saveVisible: true })} type="primary">
              Save To Many
            </Button>

            <SubmissionSelectModal
              visible={this.state.saveVisible}
              multiple={true}
              submissionType={this.submissionType}
              title="Save to Many"
              selectAll={false}
              onClose={() => this.setState({ saveVisible: false })}
              onOk={this.onSubmit}
              ignorePosting={true}
              ignoreScheduled={true}
            >
              <Alert
                type="warning"
                message={
                  <div>
                    Saving will completely remove and overwrite each submission's sections.
                    <br />
                    <br />
                    All website sections not set in this form will be removed.
                  </div>
                }
              ></Alert>
            </SubmissionSelectModal>
          </div>
        </div>
      );
    }
    return (
      <Spin spinning={this.state.loading} delay={500}>
        <div></div>
      </Spin>
    );
  }
}

export default withRouter(MultiSubmissionEditForm);
