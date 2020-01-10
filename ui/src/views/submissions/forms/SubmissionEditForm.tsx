import React from 'react';
import _ from 'lodash';
import { WebsiteRegistry } from '../../../website-components/website-registry';
import DefaultFormSection from '../form-sections/DefaultFormSection';
import SubmissionService from '../../../services/submission.service';
import SubmissionUtil from '../../../utils/submission.util';
import { FileSubmission } from '../../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { LoginStatusStore } from '../../../stores/login-status.store';
import { Match, withRouter, history } from 'react-router-dom';
import { headerStore } from '../../../stores/header.store';
import { inject, observer } from 'mobx-react';
import { uiStore } from '../../../stores/ui.store';
import { SubmissionPackage } from '../../../../../electron-app/src/submission/interfaces/submission-package.interface';
import { TreeNode } from 'antd/lib/tree-select';
import { RcFile, UploadChangeParam, UploadFile } from 'antd/lib/upload/interface';
import ImportDataSelect from '../form-components/ImportDataSelect';
import WebsiteSections from '../form-sections/WebsiteSections';
import { FormSubmissionPart } from '../interfaces/form-submission-part.interface';
import { SubmissionPart } from '../../../../../electron-app/src/submission/interfaces/submission-part.interface';
import moment from 'moment';
import { SubmissionType } from '../../../shared/enums/submission-type.enum';
import { Submission } from '../../../../../electron-app/src/submission/interfaces/submission.interface';
import { DefaultOptions } from '../../../../../electron-app/src/submission/interfaces/default-options.interface';
import { FileRecord } from '../../../../../electron-app/src/submission/file-submission/interfaces/file-record.interface';
import { UserAccountDto } from '../../../../../electron-app/src/account/interfaces/user-account.dto.interface';

import {
  Form,
  Button,
  Typography,
  Spin,
  message,
  TreeSelect,
  Anchor,
  Card,
  Upload,
  Icon,
  DatePicker,
  Popconfirm,
  Alert,
  Tooltip
} from 'antd';

interface Props {
  match: Match;
  loginStatusStore?: LoginStatusStore;
  history: history;
}

export interface SubmissionEditFormState {
  loading: boolean;
  parts: { [key: string]: FormSubmissionPart<any> };
  postAt: number | undefined;
  problems: { [key: string]: any };
  removedParts: string[];
  submission?: Submission;
  submissionType: SubmissionType;
  touched: boolean;
  hasError: boolean;
}

@inject('loginStatusStore')
@observer
class SubmissionEditForm extends React.Component<Props, SubmissionEditFormState> {
  private id: string;
  private original!: SubmissionPackage<Submission>;
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

  state: SubmissionEditFormState = {
    hasError: false,
    loading: true,
    parts: {},
    postAt: undefined,
    problems: {},
    removedParts: [],
    submission: undefined,
    submissionType: SubmissionType.FILE,
    touched: false
  };

  constructor(props: Props) {
    super(props);
    this.id = props.match.params.id;
    SubmissionService.getSubmission(this.id, true)
      .then(({ data }) => {
        this.original = _.cloneDeep(data);
        this.setState({
          ...this.state,
          ...data,
          loading: false,
          postAt: data.submission.schedule.postAt,
          submissionType: data.submission.type
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
    this.checkProblems();
  };

  checkProblems = _.debounce(() => {
    SubmissionService.checkProblems(
      this.id,
      Object.values(this.state.parts).filter(p => !this.state.removedParts.includes(p.accountId))
    ).then(({ data }) => this.setState({ problems: data }));
  }, 1250);

  onSubmit = () => {
    if (this.state.touched || this.scheduleHasChanged()) {
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
        id: this.id,
        postAt: this.state.postAt
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
        })
        .catch(() => {
          this.setState({ loading: false });
          message.error('A problem occurred when trying to save the submission.');
        });
    }
  };

  scheduleHasChanged(): boolean {
    return this.state.postAt !== this.original.submission.schedule.postAt;
  }

  websiteHasProblems = (website: string | undefined | null): boolean => {
    return !!Object.values(this.state.problems).find(
      p => p.website === website && p.problems.length
    );
  };

  websitehasWarnings = (website: string | undefined | null): boolean => {
    return !!Object.values(this.state.problems).find(
      p => p.website === website && p.warnings.length
    );
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

  getWebsiteTreeData(filter?: (status: UserAccountDto) => boolean): TreeNode[] {
    const websiteData: { [key: string]: TreeNode } = {};
    let filtered = this.props.loginStatusStore!.statuses.filter(status => {
      const website = WebsiteRegistry.websites[status.website];
      if (this.state.submissionType === SubmissionType.FILE) {
        return true; // always can expect having a file form
      } else {
        // assume notification
        return !!website.NotificationSubmissionForm;
      }
    });

    if (filter) {
      filtered = filtered.filter(filter);
    }

    filtered.forEach(status => {
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
      `https://localhost:${window['PORT']}/submission/change/primary/${
        this.state.submission!.id
      }/${encodeURIComponent(file['path'])}`
    );

  thumbnailFileChangeAction = (file: RcFile) =>
    Promise.resolve(
      `https://localhost:${window['PORT']}/submission/change/thumbnail/${
        this.state.submission!.id
      }/${encodeURIComponent(file['path'])}`
    );

  additionalFileChangeAction = (file: RcFile) =>
    Promise.resolve(
      `https://localhost:${window['PORT']}/submission/add/additional/${
        this.state.submission!.id
      }/${encodeURIComponent(file['path'])}`
    );

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
    if ((this.state.submission as FileSubmission).thumbnail) {
      SubmissionService.removeThumbnail(this.state.submission!.id)
        .then(({ data }) => {
          this.setState({ submission: data.submission, problems: data.problems });
        })
        .catch(() => {
          message.error('Failed to remove thumbnail.');
        });
    }
  }

  removeAdditionalFile(file: FileRecord) {
    SubmissionService.removeAdditionalFile(this.state.submission!.id, file.location)
      .then(({ data }) => {
        this.setState({ submission: data.submission, problems: data.problems });
      })
      .catch(() => {
        message.error('Failed to remove additional file.');
      });
  }

  handleAdditionalIgnoredAccounts(record: FileRecord, value: string[]) {
    record.ignoredAccounts = value;
    this.updateAdditionalIgnoredAccounts(record);
  }

  unsupportedAdditionalWebsites(): any {
    if ((this.state.submission as FileSubmission).additional!.length) {
      const unsupportedWebsites = Object.values(this.state.parts)
        .filter(p => !p.isDefault)
        .filter(p => !WebsiteRegistry.websites[p.website].supportsAdditionalFiles)
        .map(p => WebsiteRegistry.websites[p.website].name);
      if (unsupportedWebsites.length) {
        return (
          <Alert
            type="warning"
            message="Incompatible Websites"
            description={
              <div>
                <div>
                  The following website(s) do not support additional files:{' '}
                  {unsupportedWebsites.join()}
                </div>
              </div>
            }
          />
        );
      }
    }
    return null;
  }

  updateAdditionalIgnoredAccounts = _.debounce((record: FileRecord) => {
    SubmissionService.updateAdditionalFileIgnoredAccounts(
      this.state.submission!.id,
      record
    ).finally(this.checkProblems);
  }, 1000);

  componentWillUnmount() {
    uiStore.setPendingChanges(false);
  }

  formHasChanges(): boolean {
    return this.state.touched || this.scheduleHasChanged();
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
        this.checkProblems();
      });
    }
  }

  setHeaders() {
    if (this.headerSet) return;

    this.headerSet = true;
    const name = _.capitalize(this.state.submissionType);
    headerStore.updateHeaderState({
      title: `Edit ${name} Submission`,
      routes: [
        {
          path: `/${this.state.submissionType}`,
          breadcrumbName: `${name} Submissions`
        },
        {
          path: `/edit/submission/${this.state.submissionType}/${this.id}`,
          breadcrumbName: SubmissionUtil.getSubmissionTitle({
            submission: this.state.submission!,
            parts: this.state.parts,
            problems: {}
          })
        }
      ]
    });
  }

  static getDerivedStateFromError(error) {
    console.error(error);
    return { hasError: true };
  }

  isFileSubmission(submission: Submission): submission is FileSubmission {
    return submission.type === SubmissionType.FILE;
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
      const submission = this.state.submission!;

      this.setHeaders();

      return (
        <div>
          <div className="flex">
            <Form layout="vertical" style={{ flex: 10 }}>
              {this.isFileSubmission(submission) ? (
                <Form.Item>
                  <Typography.Title level={3}>
                    Files
                    <a className="nav-section-anchor" href="#Files" id="#Files"></a>
                  </Typography.Title>
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
                          headers={{ Authorization: window.AUTH_ID }}
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
                            headers={{ Authorization: window.AUTH_ID }}
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
                    <Card
                      title="Additional Files"
                      size="small"
                      className="mt-2"
                      extra={
                        <Upload
                          onChange={this.fileUploadChange}
                          action={this.additionalFileChangeAction}
                          multiple={false}
                          showUploadList={false}
                          headers={{ Authorization: window.AUTH_ID }}
                        >
                          <span className="text-link">Add</span>
                        </Upload>
                      }
                    >
                      {this.unsupportedAdditionalWebsites()}
                      <div className="flex flex-wrap">
                        {((this.state.submission! as FileSubmission).additional || []).map(f => {
                          return (
                            <Card
                              size="small"
                              className="w-1/4"
                              type="inner"
                              actions={[
                                <Icon type="delete" onClick={() => this.removeAdditionalFile(f)} />
                              ]}
                              cover={<img alt={f.name} src={f.preview} />}
                            >
                              <TreeSelect
                                multiple
                                treeCheckable={true}
                                treeDefaultExpandAll={true}
                                treeNodeFilterProp="title"
                                allowClear={true}
                                defaultValue={f.ignoredAccounts}
                                treeData={this.getWebsiteTreeData(
                                  status =>
                                    WebsiteRegistry.websites[status.website].supportsAdditionalFiles
                                )}
                                onChange={value => this.handleAdditionalIgnoredAccounts(f, value)}
                                placeholder="Ignored accounts"
                                maxTagCount={0}
                              />
                            </Card>
                          );
                        })}
                      </div>
                    </Card>
                  </div>
                </Form.Item>
              ) : null}

              <Form.Item>
                <Typography.Title level={3}>
                  Schedule
                  <a className="nav-section-anchor" href="#Schedule" id="#Schedule"></a>
                </Typography.Title>
                <DatePicker
                  value={this.state.postAt ? moment(this.state.postAt) : undefined}
                  format="YYYY-MM-DD HH:mm"
                  showTime={{ format: 'HH:mm' }}
                  placeholder="Unscheduled"
                  onChange={value => this.setState({ postAt: value ? value.valueOf() : undefined })}
                />
              </Form.Item>

              <Form.Item>
                <Typography.Title level={3}>
                  Defaults
                  <Tooltip title="The default fields are used by all selected websites. You can override these defaults inside of each website section.">
                    <Icon className="text-sm ml-1 text-primary" type="question-circle" />
                  </Tooltip>
                  <a className="nav-section-anchor" href="#Defaults" id="#Defaults"></a>
                </Typography.Title>
                <DefaultFormSection
                  part={this.state.parts.default}
                  problems={this.state.problems.default.problems}
                  warnings={this.state.problems.default.warnings}
                  onUpdate={this.onUpdate}
                  submission={this.state.submission!}
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
                {...this.state}
                problems={this.state.problems}
                submission={this.state.submission}
                submissionType={this.state.submissionType}
                onUpdate={this.onUpdate.bind(this)}
                removedParts={this.state.removedParts}
                parts={this.state.parts}
              />
            </Form>

            <div className="ml-1" style={{ maxWidth: '125px' }}>
              <Anchor
                onClick={this.handleNavClick}
                getContainer={() => document.getElementById('primary-container') || window}
                getCurrentAnchor={this.getHighestInViewport}
              >
                {this.state.submissionType === SubmissionType.FILE ? (
                  <Anchor.Link title="Files" href="#Files" />
                ) : null}
                <Anchor.Link title="Schedule" href="#Schedule" />
                <Anchor.Link
                  title={
                    <span>
                      {this.websiteHasProblems('default') ? (
                        <Typography.Text className="mr-1" type="danger">
                          <Icon type="warning" />
                        </Typography.Text>
                      ) : this.websitehasWarnings('default') ? (
                        <Typography.Text className="mr-1" type="warning">
                          <Icon type="exclamation" />
                        </Typography.Text>
                      ) : null}
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
                        {this.websiteHasProblems(website) ? (
                          <Typography.Text className="mr-1" type="danger">
                            <Icon type="warning" />
                          </Typography.Text>
                        ) : this.websitehasWarnings(website) ? (
                          <Typography.Text className="mr-1" type="warning">
                            <Icon type="exclamation" />
                          </Typography.Text>
                        ) : null}
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
              submissionType={this.state.submissionType}
              onPropsSelect={this.importData.bind(this)}
            />
            <Popconfirm
              disabled={!this.formHasChanges()}
              title="Are you sure? This will revert all recent changes you have made."
              onConfirm={() =>
                this.setState({
                  parts: _.cloneDeep(this.original.parts),
                  removedParts: [],
                  postAt: this.original.submission.schedule.postAt,
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

export default withRouter(SubmissionEditForm);
