import React from 'react';
import { Problems } from '../../../../../electron-app/src/submission/validator/interfaces/problems.interface';
import { Icon, Tooltip, Typography } from 'antd';
import { ProblemTree } from './ProblemTree';

export const IssueState: React.FC<{
  problems: Problems;
  problemCount: number;
}> = props => {
  return props.problemCount ? (
    <Typography.Text type="danger">
      <Tooltip
        overlayStyle={{ maxWidth: 'unset' }}
        title={<div className="bg-red-700">{<ProblemTree problems={props.problems} />}</div>}
      >
        <Icon type="warning" />
        <span className="ml-2">{props.problemCount}</span>
      </Tooltip>
    </Typography.Text>
  ) : (
    <span className="text-success">
      <Icon type="check-circle" />
      <span className="ml-2">Ready</span>
    </span>
  );
};
