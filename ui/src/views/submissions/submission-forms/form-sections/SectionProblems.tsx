import React from 'react';
import { Problem } from '../../../../../../electron-app/src/submission/validator/interfaces/problems.interface';
import { Alert } from 'antd';

const SectionProblems: React.FunctionComponent<{ problems?: Problem }> = props => (
  <div>
    {props.problems && props.problems.problems.length ? (
      <Alert
        type="error"
        message={
          <ul>
            {props.problems.problems.map(problem => (
              <li>{problem}</li>
            ))}
          </ul>
        }
      />
    ) : null}
    {props.problems && props.problems.warnings.length ? (
      <Alert
        type="warning"
        message={
          <ul>
            {props.problems.warnings.map(warning => (
              <li>{warning}</li>
            ))}
          </ul>
        }
      />
    ) : null}
  </div>
);

export default SectionProblems;
