import React from 'react';
import _ from 'lodash';
import { WebsiteRegistry } from '../../../website-components/website-registry';
import DefaultFormSection from '../form-sections/DefaultFormSection';
import { LoginStatusStore } from '../../../stores/login-status.store';
import { Match, withRouter, history } from 'react-router-dom';
import { headerStore } from '../../../stores/header.store';
import { inject, observer } from 'mobx-react';
import { uiStore } from '../../../stores/ui.store';
import { TreeNode } from 'antd/lib/tree-select';
import ImportDataSelect from '../form-components/ImportDataSelect';
import WebsiteSections from '../form-sections/WebsiteSections';
import { FormSubmissionPart } from '../interfaces/form-submission-part.interface';
import {
  SubmissionPart,
  DefaultOptions
} from '../../../../../electron-app/src/submission/interfaces/submission-part.interface';
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
import { SubmissionType } from '../../../shared/enums/submission-type.enum';
import { SubmissionTemplate } from '../../../../../electron-app/src/submission/submission-template/submission-template.interface';
import SubmissionTemplateService from '../../../services/submission-template.service';

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
  hasError: boolean;
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
    title: '',
    useThumbnail: true
  };

  state: SubmissionTemplateEditFormState = {
    template: undefined,
    parts: {},
    loading: true,
    touched: false,
    removedParts: [],
    hasError: false
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
        p.id = existing.id;
      } else {
        p._id = undefined;
        p.id = `${this.id}-${p.accountId}`;
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
        websiteData[status.website] = websiteData[status.website] || { children: [] };
        websiteData[status.website].title = status.website;
        websiteData[status.website].key = status.website;
        websiteData[status.website].value = status.website;
        (websiteData[status.website].children as any[]).push({
          key: status.id,
          value: status.id,
          title: `${status.website}: ${status.alias}`,
          isLeaf: true
        });
      });
    return Object.values(websiteData).sort((a, b) =>
      (a.title as string).localeCompare(b.title as string)
    );
  }

  getSelectedWebsiteIds(): string[] {
    return _.sortBy(
      [
        ...Object.values(this.state.parts)
          .filter(p => !p.isDefault)
          .filter(p => !this.state.removedParts.includes(p.accountId))
          .map(p => p.accountId)
      ],
      'title'
    );
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
          id: _.uniqueId('New Part'),
          website: this.props.loginStatusStore!.getWebsiteForAccountId(accountId),
          data: WebsiteRegistry.websites[
            this.props.loginStatusStore!.getWebsiteForAccountId(accountId)
          ].getDefaults(),
          isNew: true
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

  static getDerivedStateFromError(error) {
    console.error(error);
    return { hasError: true };
  }

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
    if (this.state.hasError) {
      return (
        <div>
          <Alert
            type="error"
            message="An error has occured and the submission template is unreadable."
          ></Alert>
        </div>
      );
    }

    if (!this.state.loading) {
      this.removeDeletedAccountParts();
      uiStore.setPendingChanges(this.formHasChanges());

      this.defaultOptions = this.state.parts.default.data;

      this.setHeaders();

      return (
        <div>
          <div className="flex">
            <Form layout="vertical" style={{ flex: 10 }}>
              <Form.Item>
                <Typography.Title level={3}>
                  Defaults
                  <a className="nav-section-anchor" href="#Defaults" id="#Defaults"></a>
                </Typography.Title>
                <DefaultFormSection
                  part={this.state.parts.default}
                  problems={[]}
                  onUpdate={this.onUpdate}
                  submission={{} as any}
                />
              </Form.Item>

              <Form.Item>
                <Typography.Title level={3}>
                  Websites
                  <a className="nav-section-anchor" href="#Websites" id="#Websites"></a>
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
                  <Anchor.Link title={<span>{website}</span>} href={`#${website}`} />
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
                Undo Changes
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
