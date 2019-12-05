import React from 'react';
import _ from 'lodash';
import { WebsiteRegistry } from '../../website-components/website-registry';
import DefaultFormSection from './form-sections/DefaultFormSection';
import SubmissionService from '../../services/submission.service';
import SubmissionUtil from '../../utils/submission.util';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { LoginStatusStore, loginStatusStore } from '../../stores/login-status.store';
import { Match, withRouter, history } from 'react-router-dom';
import { headerStore } from '../../stores/header.store';
import { inject, observer } from 'mobx-react';
import { uiStore } from '../../stores/ui.store';
import { SubmissionPackage } from '../../../../electron-app/src/submission/interfaces/submission-package.interface';
import { TreeNode } from 'antd/lib/tree-select';
import { RcFile, UploadChangeParam, UploadFile } from 'antd/lib/upload/interface';
import ImportDataSelect from './form-components/ImportDataSelect';
import { FormSubmissionPart } from './interfaces/form-submission-part.interface';
import {
  SubmissionPart,
  DefaultOptions
} from '../../../../electron-app/src/submission/interfaces/submission-part.interface';
import {
  Form,
  Button,
  Typography,
  Spin,
  message,
  TreeSelect,
  Tabs,
  Badge,
  Empty,
  Anchor,
  Card,
  Upload,
  Icon,
  DatePicker
} from 'antd';

interface Props {
  match?: Match;
  loginStatusStore?: LoginStatusStore;
  history: history;
}

interface State {
  submission: FileSubmission | null;
  parts: { [key: string]: FormSubmissionPart<any> };
  problems: { [key: string]: any };
  loading: boolean;
  touched: boolean;
  removedParts: string[];
  additionalFileList: any[];
}

@inject('loginStatusStore')
@observer
class SubmissionEditForm extends React.Component<Props, State> {
  private id: string;
  private original!: SubmissionPackage<FileSubmission>;
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

  state: State = {
    submission: null,
    problems: {},
    parts: {},
    loading: true,
    touched: false,
    removedParts: [],
    additionalFileList: []
  };

  constructor(props: Props) {
    super(props);
    this.id = props.match!.params.id;
    SubmissionService.getSubmission(this.id, true)
      .then(({ data }) => {
        this.original = _.cloneDeep(data);
        this.setState({
          ...this.state,
          ...data,
          additionalFileList: this.getAdditionalFileList(data.submission.additional),
          loading: false
        });
      })
      .catch(() => {
        props.history.push('/submissions');
      });
  }

  onUpdate = (updatePart: SubmissionPart<any> | Array<SubmissionPart<any>>) => {
    const parts = _.cloneDeep(this.state.parts);
    const updateParts = Array.isArray(updatePart) ? updatePart : [updatePart];
    updateParts.forEach(p => (parts[p.accountId] = p));
    const isTouched: boolean = !_.isEqual(parts, this.original.parts);
    this.setState({ parts, touched: isTouched });
    uiStore.setPendingChanges(isTouched);
    this.checkProblems();
  };

  checkProblems = _.debounce(() => {
    SubmissionService.checkProblems(
      Object.values(this.state.parts).filter(p => !this.state.removedParts.includes(p.accountId))
    ).then(({ data }) => this.setState({ problems: data }));
  }, 2000);

  onSubmit = () => {
    if (this.state.touched) {
      this.setState({ loading: true });
      SubmissionService.updateSubmission({
        parts: Object.values(this.state.parts).filter(
          p => !this.state.removedParts.includes(p.accountId)
        ),
        removedParts: _.compact(
          this.state.removedParts.map(accountId => {
            const found = Object.values(this.state.parts).find(p => p.accountId === accountId);
            if (found && !found.isNew) {
              return found.id;
            }
            return null;
          })
        ),
        id: this.id
      })
        .then(({ data }) => {
          this.original = _.cloneDeep(data);
          this.setState({
            ...this.state,
            ...data,
            loading: false,
            touched: false
          });
          message.success('Submission was successfully saved.');
          uiStore.setPendingChanges(false);
        })
        .catch(() => {
          this.setState({ loading: false });
          message.error('A problem occurred when trying to save the submission.');
        });
    }
  };

  websiteHasProblems = (website: string | undefined | null): boolean => {
    return !!Object.values(this.state.problems).find(
      p => p.website === website && p.problems.length
    );
  };

  importData(parts: Array<SubmissionPart<any>>) {
    parts.forEach(p => {
      const existing = Object.values(this.state.parts).find(part => part.accountId === p.accountId);
      if (existing) {
        p._id = existing._id;
        p.id = existing.id;
      } else {
        p.submissionId = this.id;
        p._id = undefined;
        p.id = `${this.id}-${p.accountId}`;
      }
    });

    this.onUpdate(parts);
  }

  getWebsiteTreeData(): TreeNode[] {
    const websiteData: { [key: string]: any } = {};
    this.props.loginStatusStore!.statuses.forEach(status => {
      websiteData[status.website] = websiteData[status.website] || { children: [] };
      websiteData[status.website].title = status.website;
      websiteData[status.website].key = status.website;
      websiteData[status.website].children.push({
        key: status.id,
        value: status.id,
        title: `${status.website}: ${status.alias}`
      });
    });

    return Object.values(websiteData);
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

  getWebsiteSections(): JSX.Element[] {
    const defaultPart = this.state.parts.default;
    const sections: JSX.Element[] = [];

    const parts = this.getSelectedWebsiteParts();
    const groups = _.groupBy(parts, 'website');

    Object.keys(groups).forEach(website => {
      const sortedChildren: Array<SubmissionPart<any>> = _.sortBy(groups[website], 'alias');

      const childrenSections = sortedChildren.map(child => {
        return {
          alias: this.props.loginStatusStore!.getAliasForAccountId(child.accountId),
          problems: _.get(this.state.problems[child.accountId], 'problems', []),
          key: child.accountId,
          form: WebsiteRegistry.websites[child.website].FileSubmissionForm({
            defaultData: defaultPart.data,
            part: child,
            onUpdate: this.onUpdate,
            problems: _.get(this.state.problems[child.accountId], 'problems', []),
            submission: this.state.submission!
          })
        };
      });
      const label = sections.push(
        <Form.Item className="mt-2">
          <Typography.Title style={{ marginBottom: '0' }} level={3}>
            {website}
          </Typography.Title>
          <Tabs>
            {childrenSections.map(section => (
              <Tabs.TabPane tab={section.alias} key={section.key}>
                {section.form}
              </Tabs.TabPane>
            ))}
          </Tabs>
        </Form.Item>
      );
    });

    return sections;
  }

  handleWebsiteSelect = (accountIds: string[]) => {
    const existingParts = Object.values(this.state.parts).map(p => p.accountId);
    const addedParts = accountIds.filter(id => !existingParts.includes(id));

    const removedParts = Object.values(this.state.parts)
      .filter(p => !p.isDefault)
      .map(p => p.accountId)
      .filter(id => !accountIds.includes(id));

    const parts = _.cloneDeep(this.state.parts);
    addedParts.forEach(accountId => {
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

    this.setState({
      removedParts,
      parts
    });

    this.checkProblems();
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
    return '#Files';
  };

  primaryFileChangeAction = (file: RcFile) =>
    Promise.resolve(
      `http://localhost:${window['PORT']}/submission/change/primary/${
        this.state.submission!.id
      }/${encodeURIComponent(file['path'])}`
    );

  thumbnailFileChangeAction = (file: RcFile) =>
    Promise.resolve(
      `http://localhost:${window['PORT']}/submission/change/thumbnail/${
        this.state.submission!.id
      }/${encodeURIComponent(file['path'])}`
    );

  additionalFileChangeAction = (file: RcFile) =>
    Promise.resolve(
      `http://localhost:${window['PORT']}/submission/add/additional/${
        this.state.submission!.id
      }/${encodeURIComponent(file['path'])}`
    );

  additionalFileUploadChange = (info: UploadChangeParam<UploadFile<any>>) => {
    const { status } = info.file;
    if (status === 'done') {
      message.success(`${info.file.name} file uploaded successfully.`);
      this.setState({
        submission: info.file.response.submission,
        problems: info.file.response.problems,
        additionalFileList: this.getAdditionalFileList(info.file.response.submission.additional)
      });
    } else if (status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    } else {
      this.setState({ additionalFileList: info.fileList });
    }
  };

  fileUploadChange = (info: UploadChangeParam<UploadFile<any>>) => {
    const { status } = info.file;
    if (status === 'done') {
      message.success(`${info.file.name} file uploaded successfully.`);
      this.setState({
        submission: info.file.response.submission,
        problems: info.file.response.problems
      });
    } else if (status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  removeThumbnail() {
    if (this.state.submission!.thumbnail) {
      SubmissionService.removeThumbnail(this.state.submission!.id)
        .then(({ data }) => {
          this.setState({ submission: data.submission, problems: data.problems });
        })
        .catch(() => {
          message.error('Failed to remove thumbnail.');
        });
    }
  }

  removeAdditionalFile(file: any) {
    SubmissionService.removeAdditionalFile(this.state.submission!.id, file.uid)
      .then(({ data }) => {
        this.setState({ submission: data.submission, problems: data.problems });
      })
      .catch(() => {
        message.error('Failed to remove additional file.');
      });
  }

  getAdditionalFileList(additional: any[] = []): any[] {
    return additional.map(f => ({
      uid: f.location,
      name: f.name,
      status: 'done',
      url: f.preview,
      size: f.size,
      type: f.type
    }));
  }

  componentWillUnmount() {
    uiStore.setPendingChanges(false);
  }

  render() {
    if (!this.state.loading) {
      this.defaultOptions = this.state.parts.default.data;
      const submission = this.state.submission!;

      headerStore.updateHeaderState({
        title: 'Edit Submission',
        routes: [
          {
            path: '/submissions',
            breadcrumbName: 'Submissions'
          },
          {
            path: `/edit/submission/${this.id}`,
            breadcrumbName: SubmissionUtil.getFileSubmissionTitle(this.state)
          }
        ]
      });

      return (
        <div>
          <Spin spinning={this.state.loading} delay={500}>
            <div className="flex">
              <Form layout="vertical" style={{ flex: 10, flexBasis: '75%' }}>
                <Typography.Title level={3}>
                  Files
                  <a className="nav-section-anchor" href="#Files" id="#Files"></a>
                </Typography.Title>

                <Form.Item>
                  <div className="flex">
                    <Card
                      className="flex-1"
                      title="Primary"
                      size="small"
                      cover={
                        <img
                          alt={submission.primary.name}
                          title={submission.primary.name}
                          src={submission.primary.preview}
                        />
                      }
                      extra={
                        <Upload
                          accept="image/jpeg,image/jpg,image/png"
                          showUploadList={false}
                          onChange={this.fileUploadChange}
                          action={this.primaryFileChangeAction}
                        >
                          <span className="text-link">Change</span>
                        </Upload>
                      }
                      bodyStyle={{ padding: '0' }}
                    ></Card>
                    <Card
                      className="flex-1 ml-2"
                      title="Thumbnail"
                      size="small"
                      cover={
                        submission.thumbnail ? (
                          <img
                            alt={submission.thumbnail.name}
                            title={submission.thumbnail.name}
                            src={submission.thumbnail.preview}
                          />
                        ) : null
                      }
                      extra={
                        submission.thumbnail ? (
                          <span className="text-link" onClick={this.removeThumbnail.bind(this)}>
                            Remove
                          </span>
                        ) : (
                          <Upload
                            accept="image/jpeg,image/jpg,image/png"
                            showUploadList={false}
                            beforeUpload={file => {
                              return file.type.includes('image/');
                            }}
                            onChange={this.fileUploadChange}
                            action={this.thumbnailFileChangeAction}
                          >
                            <span className="text-link">Set</span>
                          </Upload>
                        )
                      }
                      bodyStyle={!submission.thumbnail ? {} : { padding: '0' }}
                    >
                      <Card.Meta
                        description={submission.thumbnail ? null : 'No thumbnail provided'}
                      />
                    </Card>
                  </div>
                  <div>
                    <Card title="Additional Files" size="small" className="mt-2">
                      <Upload
                        onChange={this.additionalFileUploadChange}
                        action={this.additionalFileChangeAction}
                        multiple={false}
                        listType="picture-card"
                        showUploadList={{
                          showRemoveIcon: true,
                          showDownloadIcon: false,
                          showPreviewIcon: false
                        }}
                        fileList={this.state.additionalFileList}
                        onRemove={this.removeAdditionalFile.bind(this)}
                      >
                        {(this.state.submission!.additional || []).length < 8 ? (
                          <div>
                            <Icon type="plus" />
                            <div className="ant-upload-text">Add</div>
                          </div>
                        ) : null}
                      </Upload>
                    </Card>
                  </div>
                </Form.Item>

                <Typography.Title level={3}>
                  Schedule
                  <a className="nav-section-anchor" href="#Schedule" id="#Schedule"></a>
                </Typography.Title>
                <Form.Item></Form.Item>

                <Typography.Title level={3}>
                  Defaults
                  <a className="nav-section-anchor" href="#Defaults" id="#Defaults"></a>
                </Typography.Title>
                <DefaultFormSection
                  part={this.state.parts.default}
                  problems={this.state.problems.default.problems}
                  onUpdate={this.onUpdate}
                  submission={this.state.submission!}
                />

                <Typography.Title level={3}>
                  Websites
                  <a className="nav-section-anchor" href="#Websites" id="#Websites"></a>
                </Typography.Title>
                <TreeSelect
                  multiple
                  treeCheckable={true}
                  treeDefaultExpandAll={true}
                  allowClear={true}
                  value={this.getSelectedWebsiteIds()}
                  treeData={this.getWebsiteTreeData()}
                  onChange={this.handleWebsiteSelect}
                  placeholder="Select websites to post to"
                />
                <WebsiteSections {...this.state} onUpdate={this.onUpdate.bind(this)} />
              </Form>

              <div className="ml-1">
                <Anchor
                  onClick={this.handleNavClick}
                  getContainer={() => document.getElementById('primary-container') || window}
                  getCurrentAnchor={this.getHighestInViewport}
                >
                  <Anchor.Link title="Files" href="#Files" />
                  <Anchor.Link
                    title={
                      <span>
                        {this.websiteHasProblems('default') ? <Icon type="warning" /> : null}{' '}
                        Defaults
                      </span>
                    }
                    href="#Defaults"
                  />
                  <Anchor.Link title="Websites" href="#Websites" />
                  {this.getSelectedWebsites().map(website => (
                    <Anchor.Link
                      title={
                        <span>
                          {this.websiteHasProblems(website) ? <Icon type="warning" /> : null}{' '}
                          {website}
                        </span>
                      }
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
                submissionType={this.state.submission!.type}
                onPropsSelect={this.importData.bind(this)}
              />
              <Button onClick={this.onSubmit} type="primary" disabled={!this.state.touched}>
                Save
              </Button>
            </div>
          </Spin>
        </div>
      );
    }
    return <div></div>;
  }
}

export default withRouter(SubmissionEditForm);

interface WebsiteSectionsProps extends State {
  onUpdate: (update: any) => void;
}

const WebsiteSections: React.FC<WebsiteSectionsProps> = props => {
  const defaultPart = props.parts.default;
  const sections: JSX.Element[] = [];

  const parts = _.sortBy(
    Object.values(props.parts)
      .filter(p => !p.isDefault)
      .filter(p => !props.removedParts.includes(p.accountId)),
    'website'
  );

  const groups = _.groupBy(parts, 'website');

  Object.keys(groups).forEach(website => {
    const sortedChildren: Array<SubmissionPart<any>> = _.sortBy(groups[website], 'alias');

    const childrenSections = sortedChildren.map(child => {
      return {
        alias: loginStatusStore!.getAliasForAccountId(child.accountId),
        problems: _.get(props.problems[child.accountId], 'problems', []),
        key: child.accountId,
        form: WebsiteRegistry.websites[child.website].FileSubmissionForm({
          defaultData: defaultPart.data,
          part: child,
          onUpdate: props.onUpdate,
          problems: _.get(props.problems[child.accountId], 'problems', []),
          submission: props.submission!
        })
      };
    });
    const label = sections.push(
      <Form.Item>
        <Typography.Title style={{ marginBottom: '0' }} level={3}>
          {website}
          <a className="nav-section-anchor" href={`#${website}`} id={`#${website}`}></a>
        </Typography.Title>
        <Tabs>
          {childrenSections.map(section => (
            <Tabs.TabPane
              tab={
                <span>
                  <span className="mr-1">{section.alias}</span>
                  {section.problems.length ? <Badge count={section.problems.length} /> : null}
                </span>
              }
              key={section.key}
            >
              {loginStatusStore.getWebsiteLoginStatusForAccountId(section.key) ? (
                section.form
              ) : (
                <Empty
                  description={<Typography.Text type="danger">Not logged in.</Typography.Text>}
                />
              )}
            </Tabs.TabPane>
          ))}
        </Tabs>
      </Form.Item>
    );
  });

  return <div className="mt-2">{sections}</div>;
};
