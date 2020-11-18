import React from 'react';
import _ from 'lodash';
import { SubmissionPart } from 'postybirb-commons';
import { loginStatusStore, LoginStatusStore } from '../../../../stores/login-status.store';
import { WebsiteRegistry } from '../../../../websites/website-registry';
import { Form, Typography, Tabs, Badge, Empty } from 'antd';
import { inject, observer } from 'mobx-react';
import { SubmissionType } from 'postybirb-commons';
import { FileSubmission } from 'postybirb-commons';
import { Submission } from 'postybirb-commons';
import { FormSubmissionPart } from '../interfaces/form-submission-part.interface';
import { Problems } from 'postybirb-commons';

interface WebsiteSectionsProps {
  loginStatusStore?: LoginStatusStore;
  onUpdate: (update: any) => void;
  parts: { [key: string]: FormSubmissionPart<any> };
  problems: Problems;
  removedParts: string[];
  submission?: Submission;
  submissionType: SubmissionType;
}

@inject('loginStatusStore')
@observer
export default class WebsiteSections extends React.Component<WebsiteSectionsProps> {
  render() {
    const props = this.props;
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
          form:
            this.props.submissionType === SubmissionType.FILE
              ? WebsiteRegistry.websites[child.website].FileSubmissionForm({
                  defaultData: defaultPart.data,
                  part: child,
                  onUpdate: props.onUpdate,
                  problems: props.problems[child.accountId],
                  submission: props.submission! as FileSubmission
                })
              : WebsiteRegistry.websites[child.website].NotificationSubmissionForm!({
                  defaultData: defaultPart.data,
                  part: child,
                  onUpdate: props.onUpdate,
                  problems: props.problems[child.accountId],
                  submission: props.submission!
                })
        };
      });
      sections.push(
        <Form.Item className="form-section jumpable-section">
          <Typography.Title style={{ marginBottom: '0' }} level={3}>
            <span className="form-section-header nav-section-anchor" id={`#${website}`}>
              {WebsiteRegistry.find(website)?.name}
            </span>
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

    return sections;
  }
}
