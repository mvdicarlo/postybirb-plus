import React from 'react';
import _ from 'lodash';
import { WebsiteRegistry } from '../../website-components/website-registry';
import DefaultFormSection from './form-sections/DefaultFormSection';
import SubmissionService from '../../services/submission.service';
import SubmissionUtil from '../../utils/submission.util';
import { FileSubmission } from '../../../../electron-app/src/submission/file-submission/interfaces/file-submission.interface';
import { LoginStatusStore } from '../../stores/login-status.store';
import { Match } from 'react-router-dom';
import { headerStore } from '../../stores/header.store';
import { inject, observer } from 'mobx-react';
import { uiStore } from '../../stores/ui.store';
import { SubmissionPackage } from '../../../../electron-app/src/submission/interfaces/submission-package.interface';
import {
  SubmissionPart,
  DefaultOptions
} from '../../../../electron-app/src/submission/interfaces/submission-part.interface';
import { Form, Button, Typography, Spin, message, TreeSelect, Divider, Tabs, Alert } from 'antd';
import { TreeNode } from 'antd/lib/tree-select';

interface Props {
  match?: Match;
  loginStatusStore?: LoginStatusStore;
}

interface State {
  submission: FileSubmission | null;
  parts: { [key: string]: SubmissionPart<any> };
  problems: { [key: string]: any };
  loading: boolean;
  touched: boolean;
  addedParts: Array<SubmissionPart<any>>;
  removedParts: string[];
}

@inject('loginStatusStore')
@observer
export default class SubmissionEditForm extends React.Component<Props, State> {
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
    title: ''
  };

  state: State = {
    submission: null,
    problems: {},
    parts: {},
    loading: true,
    touched: false,
    addedParts: [],
    removedParts: []
  };

  constructor(props: Props) {
    super(props);
    this.id = props.match!.params.id;
    SubmissionService.getFileSubmissionPackage(this.id).then(({ data }) => {
      this.original = _.cloneDeep(data);
      this.setState({
        ...this.state,
        ...data,
        loading: false
      });
    });
  }

  onUpdate = updatePart => {
    const parts = _.cloneDeep(this.state.parts);
    parts[updatePart.accountId] = updatePart;
    const isTouched: boolean = !_.isEqual(parts, this.original.parts);
    this.setState({ parts, touched: isTouched });
    uiStore.setPendingChanges(isTouched);
  };

  onSubmit = () => {
    if (this.state.touched) {
      this.setState({ loading: true });
      SubmissionService.updateSubmission({
        parts: Object.values(this.state.parts),
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

  getWebsiteTreeData(): TreeNode[] {
    const websiteData: { [key: string]: any } = {};
    this.props.loginStatusStore!.statuses.forEach(status => {
      websiteData[status.website] = websiteData[status.website] || { children: [] };
      websiteData[status.website].title = status.website;
      websiteData[status.website].key = status.website;
      websiteData[status.website].children.push({
        key: status.id,
        value: status.id,
        title: status.alias
      });
    });

    return Object.values(websiteData);
  }

  getSelectedWebsiteIds(): string[] {
    return _.sortBy(
      [
        ...Object.values(this.state.parts)
          .filter(p => p.website !== 'default')
          .map(p => p.accountId),
        ...this.state.addedParts.map(p => p.accountId)
      ],
      'title'
    );
  }

  getWebsiteSections(): JSX.Element[] {
    const defaultPart = this.state.parts.default;
    const sections: JSX.Element[] = [];

    const parts = _.sortBy(
      [...this.state.addedParts, ...Object.values(this.state.parts)]
      .filter(p => p.website !== 'default')
      .filter(p =>
        !this.state.removedParts.includes(p.accountId)
      ),
      'website'
    );

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
            problems: _.get(this.state.problems[child.accountId], 'problems', [])
          })
        };
      });
      const label = <Typography.Title level={3}>{website}</Typography.Title>;
      sections.push(
        <Form.Item label={label}>
          <Tabs>
            {childrenSections.map(section => (
              <Tabs.TabPane tab={section.alias} key={section.key}>
                {section.problems.length ? (
                  <Alert
                    type="error"
                    message={
                      <ul>
                        {section.problems.map(problem => (
                          <li>{problem}</li>
                        ))}
                      </ul>
                    }
                  />
                ) : null}
                {section.form}
              </Tabs.TabPane>
            ))}
          </Tabs>
        </Form.Item>
      );
    });

    return sections;
  }

  handleWebsiteSelect = values => {
    const existingParts = [
      ...Object.values(this.state.parts).map(p => p.accountId),
      ...this.state.addedParts.map(p => p.accountId)
    ];
    const addedParts = values.filter(id => !existingParts.includes(id));

    const removedParts = Object.values(this.state.parts)
      .filter(p => p.website !== 'default')
      .map(p => p.accountId)
      .filter(id => !values.includes(id));

    this.setState({
      removedParts,
      addedParts: [
        ...this.state.addedParts.filter(p => values.includes(p.accountId)),
        ...addedParts.map(
          (accountId: string): SubmissionPart<any> => ({
            accountId,
            submissionId: this.state.submission!.id,
            id: Date.now.toString(),
            website: this.props.loginStatusStore!.getWebsiteForAccountId(accountId),
            data: WebsiteRegistry.websites[
              this.props.loginStatusStore!.getWebsiteForAccountId(accountId)
            ].getDefaults()
          })
        )
      ]
    });
  };

  componentWillUnmount() {
    uiStore.setPendingChanges(false);
  }

  render() {
    if (!this.state.loading) {
      this.defaultOptions = this.state.parts.default.data;

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
            <Form layout="vertical">
              <Typography.Title level={3}>Defaults</Typography.Title>
              <DefaultFormSection
                part={this.state.parts.default}
                problems={this.state.problems.default}
                onUpdate={this.onUpdate}
              />

              <Divider className="my-2" />

              <Typography.Title level={3}>Websites</Typography.Title>
              <TreeSelect
                multiple
                treeCheckable={true}
                treeDefaultExpandAll={true}
                allowClear={true}
                value={this.getSelectedWebsiteIds()}
                treeData={this.getWebsiteTreeData()}
                onChange={this.handleWebsiteSelect}
              />
              {this.getWebsiteSections()}
            </Form>
            <div className="py-2 text-right z-10 sticky bg-white bottom-0">
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
