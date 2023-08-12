import React from 'react';
import _ from 'lodash';
import { WebsiteRegistry } from '../../../../websites/website-registry';
import DefaultFormSection from '../form-sections/DefaultFormSection';
import SubmissionService from '../../../../services/submission.service';
import SubmissionUtil from '../../../../utils/submission.util';
import { FileSubmission } from 'postybirb-commons';
import { LoginStatusStore } from '../../../../stores/login-status.store';
import { Match, withRouter, history } from 'react-router-dom';
import { headerStore } from '../../../../stores/header.store';
import { inject, observer } from 'mobx-react';
import { uiStore } from '../../../../stores/ui.store';
import { SubmissionPackage } from 'postybirb-commons';
import { TreeNode } from 'antd/lib/tree-select';
import { RcFile, UploadChangeParam, UploadFile } from 'antd/lib/upload/interface';
import ImportDataSelect from '../form-components/ImportDataSelect';
import WebsiteSections from '../form-sections/WebsiteSections';
import { FormSubmissionPart } from '../interfaces/form-submission-part.interface';
import { SubmissionPart } from 'postybirb-commons';
import moment from 'moment';
import { SubmissionType } from 'postybirb-commons';
import { Submission } from 'postybirb-commons';
import { DefaultOptions } from 'postybirb-commons';
import { FileRecord } from 'postybirb-commons';
import { UserAccountDto } from 'postybirb-commons';
import { submissionStore } from '../../../../stores/submission.store';
import PostService from '../../../../services/post.service';
import FallbackStoryInput from '../form-components/FallbackStoryInput';
import RemoteService from '../../../../services/remote.service';
import SubmissionImageCropper from '../../submission-image-cropper/SubmissionImageCropper';
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
import { Problem } from 'postybirb-commons';
import { scrollSubmissionStore } from '../../../../stores/scroll-submission.store';

interface Props {
  match: Match;
  loginStatusStore?: LoginStatusStore;
  history: history;
}

export interface SubmissionEditFormState {
  loading: boolean;
  parts: { [key: string]: FormSubmissionPart<any> };
  postAt: number | undefined;
  problems: { [key: string]: Problem };
  removedParts: string[];
  submission?: Submission;
  submissionType: SubmissionType;
  touched: boolean;
  showThumbnailCropper: boolean;
  thumbnailFileForCrop?: File;
  imageCropperResolve?: (file: File) => void;
  imageCropperReject?: () => void;
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
    rating: undefined,
    title: '',
    sources: []
  };

  state: SubmissionEditFormState = {
    loading: true,
    parts: {},
    postAt: undefined,
    problems: {},
    removedParts: [],
    submission: undefined,
    submissionType: SubmissionType.FILE,
    touched: false,
    showThumbnailCropper: false
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
        props.history.push('/home');
      });
  }

  componentDidMount() {
    scrollSubmissionStore.set(this.id);
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

  close(): void {
    this.props.history.push(`/${this.state.submissionType}`);
  }

  onSubmit(close: boolean) {
    return new Promise<void>(resolve => {
      if (this.state.touched || this.scheduleHasChanged()) {
        const submissionFromStore = submissionStore.getSubmission(this.id);
        if (submissionFromStore && submissionFromStore.submission.isPosting) {
          message.error('Cannot update a submission that is posting.');
          return;
        }

        this.setState({ loading: true });
        SubmissionService.updateSubmission({
          parts: Object.values(this.state.parts).filter(
            p => !this.state.removedParts.includes(p.accountId)
          ),
          removedParts: this.state.removedParts
            .filter(accountId => this.state.parts[accountId])
            .filter(accountId => !this.state.parts[accountId].isNew)
            .map(accountId => this.state.parts[accountId]._id),
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
            if (close) {
              this.close();
            }
          })
          .catch(() => {
            this.setState({ loading: false });
            message.error('A problem occurred when trying to save the submission.');
          })
          .finally(resolve as any);
      }
    });
  }

  onClose = () => {
    if (this.formHasChanges()) {
      this.onSubmit(true);
    } else {
      this.close();
    }
  };

  onPost = async (saveFirst: boolean) => {
    if (saveFirst) {
      await this.onSubmit(false);
    }

    uiStore.setPendingChanges(false);

    if (this.state.postAt) {
      SubmissionService.schedule(this.id, true, this.state.postAt)
        .then(() => {
          message.success('Submission scheduled.');
        })
        .catch(() => {
          message.error('Unable to schedule submission.');
        });
    } else {
      PostService.queue(this.id)
        .then(() => {
          message.success('Submission queued.');
          this.props.history.push(`/${this.state.submissionType}/posting`);
        })
        .catch(() => {
          message.error('Unable to queue submission.');
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
          ].getDefaults(this.original.submission.type),
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
    RemoteService.getUrl(`/submission/change/primary/${this.state.submission!._id}`);

  thumbnailFileChangeAction = (file: RcFile) =>
    RemoteService.getUrl(`/submission/change/thumbnail/${this.state.submission!._id}`);

  additionalFileChangeAction = (file: RcFile) =>
    RemoteService.getUrl(`/submission/add/additional/${this.state.submission!._id}`);

  fileUploadChange = (info: UploadChangeParam<UploadFile<any>>) => {
    const { status } = info.file;
    if (status === 'done') {
      message.success(`${info.file.name} file uploaded successfully.`);
      this.setState({
        submission: info.file.response.submission
        // problems: info.file.response.problems
      });
      this.checkProblems();
    } else if (status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  fallbackUploadChange(info: SubmissionPackage<any>) {
    this.setState({
      submission: info.submission
      // problems: info.problems
    });
    this.checkProblems();
  }

  cropThumbnail(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      this.setState({
        showThumbnailCropper: true,
        thumbnailFileForCrop: file,
        imageCropperResolve: resolve,
        imageCropperReject: reject
      });
    }).finally(() => {
      this.setState({
        showThumbnailCropper: false,
        thumbnailFileForCrop: undefined,
        imageCropperResolve: undefined,
        imageCropperReject: undefined
      });
    });
  }

  removeThumbnail() {
    if ((this.state.submission as FileSubmission).thumbnail) {
      SubmissionService.removeThumbnail(this.state.submission!._id)
        .then(({ data }) => {
          this.setState({ submission: data.submission, problems: data.problems });
        })
        .catch(() => {
          message.error('Failed to remove thumbnail.');
        });
    }
  }

  removeAdditionalFile(file: FileRecord) {
    SubmissionService.removeAdditionalFile(this.state.submission!._id, file.location)
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
        .filter(p => p.postStatus !== 'SUCCESS')
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
                  {unsupportedWebsites.join(', ')}
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
      this.state.submission!._id,
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
            problems: {},
            hasProblems: false
          })
        }
      ]
    });
  }

  isFileSubmission(submission: Submission): submission is FileSubmission {
    return submission.type === SubmissionType.FILE;
  }

  render() {
    if (!this.state.loading) {
      this.removeDeletedAccountParts();
      uiStore.setPendingChanges(this.formHasChanges());

      this.defaultOptions = this.state.parts.default.data;
      const submission = this.state.submission!;

      this.setHeaders();

      const submissionFromStore = submissionStore.getSubmission(this.id);
      const isPosting = submissionFromStore && submissionFromStore.submission.isPosting;
      const isQueued = submissionFromStore && submissionFromStore.submission.isQueued;
      const isScheduled =
        submissionFromStore && submissionFromStore.submission.schedule.isScheduled;

      return (
        <div className="submission-form">
          <div className="flex">
            <Form layout="vertical" style={{ flex: 10 }}>
              {this.isFileSubmission(submission) ? (
                <Form.Item className="form-section">
                  <Typography.Title level={3}>
                    <span className="form-section-header nav-section-anchor" id="#Files">
                      Files
                    </span>
                  </Typography.Title>
                  <div className="flex">
                    <Card
                      className="flex-1 file-card"
                      title="Primary"
                      size="small"
                      cover={
                        <Upload.Dragger
                          className="h-full w-full"
                          showUploadList={false}
                          onChange={this.fileUploadChange}
                          action={this.primaryFileChangeAction}
                          headers={{ Authorization: window.AUTH_ID }}
                          data={file => ({ path: file['path'] })}
                        >
                          <img
                            alt={submission.primary.name}
                            title={submission.primary.name}
                            src={RemoteService.getFileUrl(submission.primary.preview)}
                          />
                        </Upload.Dragger>
                      }
                      extra={
                        <Upload
                          showUploadList={false}
                          onChange={this.fileUploadChange}
                          action={this.primaryFileChangeAction}
                          headers={{ Authorization: window.AUTH_ID }}
                          data={file => ({ path: file['path'] })}
                        >
                          <span className="text-link">Change</span>
                        </Upload>
                      }
                      bodyStyle={{ padding: '0' }}
                    ></Card>
                    <Card
                      className="flex-1 ml-2 file-card"
                      title="Thumbnail"
                      size="small"
                      cover={
                        <Upload.Dragger
                          className="h-full w-full"
                          accept="image/jpeg,image/png"
                          showUploadList={false}
                          beforeUpload={file => {
                            if (!file.type.includes('image/')) return false;
                            return this.cropThumbnail(file);
                          }}
                          onChange={this.fileUploadChange}
                          action={this.thumbnailFileChangeAction}
                          headers={{ Authorization: window.AUTH_ID }}
                          data={file => ({ path: file['path'] })}
                        >
                          {submission.thumbnail ? (
                            <img
                              alt={submission.thumbnail.name}
                              title={submission.thumbnail.name}
                              src={RemoteService.getFileUrl(submission.thumbnail.preview)}
                            />
                          ) : (
                            'No thumbnail provided'
                          )}
                        </Upload.Dragger>
                      }
                      extra={
                        submission.thumbnail ? (
                          <span className="text-link" onClick={this.removeThumbnail.bind(this)}>
                            Remove
                          </span>
                        ) : (
                          <Upload
                            accept="image/jpeg,image/png"
                            showUploadList={false}
                            beforeUpload={file => {
                              if (!file.type.includes('image/')) return false;
                              return this.cropThumbnail(file);
                            }}
                            onChange={this.fileUploadChange}
                            action={this.thumbnailFileChangeAction}
                            headers={{ Authorization: window.AUTH_ID }}
                            data={file => ({ path: file['path'] })}
                          >
                            <span className="text-link">Set</span>
                          </Upload>
                        )
                      }
                      bodyStyle={{ padding: '0' }}
                    >
                      <SubmissionImageCropper
                        visible={this.state.showThumbnailCropper}
                        file={this.state.thumbnailFileForCrop!}
                        onSubmit={this.state.imageCropperResolve!}
                        onClose={this.state.imageCropperReject!}
                      />
                    </Card>
                  </div>
                  <div>
                    <Card
                      title="Additional Files"
                      size="small"
                      className="mt-2 additional-file-card"
                      extra={
                        <Upload
                          onChange={this.fileUploadChange}
                          action={this.additionalFileChangeAction}
                          multiple={false}
                          showUploadList={false}
                          headers={{ Authorization: window.AUTH_ID }}
                          data={file => ({ path: file['path'] })}
                        >
                          <span className="text-link">Add</span>
                        </Upload>
                      }
                    >
                      {this.unsupportedAdditionalWebsites()}
                      <div className="flex flex-wrap">
                        {(submission.additional || []).map(f => {
                          return (
                            <Card
                              size="small"
                              className="w-1/4"
                              type="inner"
                              actions={[
                                <Icon type="delete" onClick={() => this.removeAdditionalFile(f)} />
                              ]}
                              cover={
                                <img
                                  alt={f.name}
                                  title={f.name}
                                  src={RemoteService.getFileUrl(f.preview)}
                                />
                              }
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
                                    !!WebsiteRegistry.websites[status.website]
                                      .supportsAdditionalFiles
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
                  <FallbackStoryInput
                    uploadCallback={this.fallbackUploadChange.bind(this)}
                    submission={submission}
                    websites={this.getSelectedWebsiteParts().map(
                      p => WebsiteRegistry.websites[p.website]
                    )}
                  />
                </Form.Item>
              ) : null}

              <Form.Item className="form-section jumpable-section">
                <Typography.Title level={3}>
                  <span className="form-section-header nav-section-anchor" id="#Schedule">
                    Schedule
                  </span>
                </Typography.Title>
                <DatePicker
                  value={this.state.postAt ? moment(this.state.postAt) : undefined}
                  format="YYYY-MM-DD HH:mm:ss"
                  showTime={{ format: 'HH:mm:ss', use12Hours: true }}
                  placeholder="Unscheduled"
                  onChange={value => this.setState({ postAt: value ? value.valueOf() : undefined })}
                />
              </Form.Item>

              <Form.Item className="form-section jumpable-section">
                <Typography.Title level={3}>
                  <span className="form-section-header nav-section-anchor" id="#Defaults">
                    Defaults
                  </span>
                  <Tooltip title="The default fields are used by all selected websites. You can override these defaults inside of each website section.">
                    <Icon className="text-sm ml-1 text-primary" type="question-circle" />
                  </Tooltip>
                </Typography.Title>
                <DefaultFormSection
                  part={this.state.parts.default}
                  problems={this.state.problems.default}
                  onUpdate={this.onUpdate}
                  submission={this.state.submission!}
                />
              </Form.Item>

              <Form.Item className="form-section jumpable-section">
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
                        {WebsiteRegistry.websites[website].name}
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
              label="Import Template"
            />
            <Popconfirm
              disabled={!this.formHasChanges()}
              title="Are you sure? This will revert all recent changes you have made."
              onConfirm={() => {
                this.setState({
                  parts: _.cloneDeep(this.original.parts),
                  removedParts: [],
                  postAt: this.original.submission.schedule.postAt,
                  touched: false
                });

                this.checkProblems();
              }}
            >
              <Button className="mr-1" disabled={!this.formHasChanges()}>
                Undo
              </Button>
            </Popconfirm>

            <Button
              className="mr-1"
              onClick={() => this.onSubmit(false)}
              type="primary"
              disabled={!this.formHasChanges()}
            >
              Save
            </Button>

            <Button
              className="mr-1"
              onClick={this.onClose}
              type={this.formHasChanges() ? 'primary' : 'default'}
            >
              {this.formHasChanges() ? 'Save and Close' : 'Close'}
            </Button>

            {isPosting ? (
              <Typography.Text type="danger">
                Updates cannot be made while the submission is posting.
              </Typography.Text>
            ) : isScheduled || isQueued ? null : (
              <span>
                {this.formHasChanges() ? (
                  <Popconfirm
                    title="The submission has unsaved changes. Would you like to save them first?"
                    disabled={SubmissionUtil.getProblemCount(this.state.problems) > 0}
                    onConfirm={() => this.onPost(true)}
                    onCancel={() => this.onPost(false)}
                    cancelText="No"
                  >
                    <Button
                      type="primary"
                      disabled={SubmissionUtil.getProblemCount(this.state.problems) > 0}
                    >
                      {this.state.postAt ? 'Schedule' : 'Post'}
                    </Button>
                  </Popconfirm>
                ) : (
                  <Button
                    type="primary"
                    onClick={() => this.onPost(false)}
                    disabled={SubmissionUtil.getProblemCount(this.state.problems) > 0}
                  >
                    {this.state.postAt ? 'Schedule' : 'Post'}
                  </Button>
                )}
              </span>
            )}
          </div>
        </div>
      );
    }
    return (
      <Spin spinning={this.state.loading} delay={500}>
        <div className="h-1/2 w-full"></div>
      </Spin>
    );
  }
}

export default withRouter(SubmissionEditForm);
