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
import { SubmissionPart } from 'postybirb-commons';
import { SubmissionType } from 'postybirb-commons';
import { SubmissionTemplate } from 'postybirb-commons';
import SubmissionTemplateService from '../../../../services/submission-template.service';
import { DefaultOptions } from 'postybirb-commons';
import { Form, Button, Typography, Spin, message, TreeSelect, Anchor, Popconfirm } from 'antd';

interface Props {
  match: Match;
  loginStatusStore?: LoginStatusStore;
  history: history;
}

export interface SubmissionTemplateEditFormState {
  template: SubmissionTemplate | undefined;
  parts: { [key: string]: FormSubmissionPart<any> };
  loading: boolean;
  touched: boolean;
  removedParts: string[];
}

@inject('loginStatusStore')
@observer
class SubmissionTemplateEditForm extends React.Component<Props, SubmissionTemplateEditFormState> {
  private id: string;
  private original!: SubmissionTemplate;
  private headerSet: boolean = false;
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

  state: SubmissionTemplateEditFormState = {
    template: undefined,
    parts: {},
    loading: true,
    touched: false,
    removedParts: []
  };

  constructor(props: Props) {
    super(props);
    this.id = props.match.params.id;
    SubmissionTemplateService.getTemplate(this.id)
      .then((template: SubmissionTemplate) => {
        this.original = _.cloneDeep(template);
        this.setState({ loading: false, template, parts: template ? template.parts : {} });
      })
      .catch(() => {
        props.history.push('/submission-templates');
      });
  }

  onUpdate = (updatePart: SubmissionPart<any> | Array<SubmissionPart<any>>) => {
    const parts = _.cloneDeep(this.state.parts);
    const updateParts = Array.isArray(updatePart) ? updatePart : [updatePart];
    updateParts.forEach(p => (parts[p.accountId] = p));
    const isTouched: boolean = !_.isEqual(parts, this.original.parts);
    this.setState({ parts, touched: isTouched });
  };

  onSubmit = () => {
    if (this.state.touched) {
      this.setState({ loading: true });
      const updatedParts = _.cloneDeep(this.state.parts);
      this.state.removedParts.forEach(accountId => delete updatedParts[accountId]);
      SubmissionTemplateService.updateTemplate({
        parts: updatedParts,
        id: this.id
      })
        .then(template => {
          this.original = _.cloneDeep(template);
          this.setState({
            ...this.state,
            template,
            parts: template.parts,
            loading: false,
            touched: false
          });
          message.success('Submission Template was successfully saved.');
        })
        .catch(() => {
          this.setState({ loading: false });
          message.error('A problem occurred when trying to save the submission template.');
        });
    }
  };

  importData(parts: Array<SubmissionPart<any>>) {
    parts.forEach(p => {
      const existing = Object.values(this.state.parts).find(part => part.accountId === p.accountId);
      p.submissionId = this.id;
      if (existing) {
        p._id = existing._id;
        if (!p.data.title) {
          p.data.title = existing.data.title;
        }
        if (!p.data.rating) {
          p.data.rating = existing.data.rating;
        }
      } else {
        p._id = `${this.id}-${p.accountId}`;
      }
    });

    this.onUpdate(parts);
  }

  getWebsiteTreeData(): TreeNode[] {
    const websiteData: { [key: string]: TreeNode } = {};
    this.props
      .loginStatusStore!.statuses.filter(status => {
        const website = WebsiteRegistry.websites[status.website];
        if (this.state.template!.type === SubmissionType.FILE) {
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
          submissionId: this.id,
          _id: _.uniqueId('New Part'),
          website: this.props.loginStatusStore!.getWebsiteForAccountId(accountId),
          data: WebsiteRegistry.websites[
            this.props.loginStatusStore!.getWebsiteForAccountId(accountId)
          ].getDefaults(this.original.type),
          isNew: true,
          created: Date.now()
        };
      });

    const isTouched: boolean = !_.isEqual(
      Object.values(parts).filter(p => !removedParts.includes(p.accountId)),
      Object.values(this.original.parts)
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
        delete this.original.parts[p.accountId];
        delete copy[p.accountId];
        this.setState({ parts: copy });
      });
    }
  }

  setHeaders() {
    if (this.headerSet) return;

    this.headerSet = true;
    headerStore.updateHeaderState({
      title: 'Edit Submission Template',
      routes: [
        {
          path: '/submission-templates',
          breadcrumbName: 'Submission Templates'
        },
        {
          path: `/edit/submission-template/${this.id}`,
          breadcrumbName: this.state.template!.alias
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
                submissionType={this.state.template!.type}
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
              ignoreId={this.id}
              submissionType={this.state.template!.type}
              onPropsSelect={this.importData.bind(this)}
              hideUseTemplateTitle={true}
            />
            <Popconfirm
              disabled={!this.formHasChanges()}
              title="Are you sure? This will revert all recent changes you have made."
              onConfirm={() =>
                this.setState({
                  parts: _.cloneDeep(this.original.parts),
                  removedParts: [],
                  touched: false
                })
              }
            >
              <Button className="mr-1" disabled={!this.formHasChanges()}>
                Undo
              </Button>
            </Popconfirm>

            <Button onClick={this.onSubmit} type="primary" disabled={!this.formHasChanges()}>
              Save
            </Button>
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

export default withRouter(SubmissionTemplateEditForm);
