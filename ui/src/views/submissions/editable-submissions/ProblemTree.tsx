import React from 'react';
import _ from 'lodash';
import { Problems } from 'postybirb-commons';
import { loginStatusStore } from '../../../stores/login-status.store';
import { Tree } from 'antd';

interface ProblemTreeProps {
  problems: Problems;
}

export class ProblemTree extends React.Component<ProblemTreeProps> {
  createProblemNode = (problem: string): any => {
    return <Tree.TreeNode title={problem} />;
  };

  createAliasNode = (problemObj: any): any => {
    const children = problemObj.problems.map(this.createProblemNode);
    return (
      <Tree.TreeNode
        title={
          <span className="capitalize">
            {loginStatusStore.getAliasForAccountId(problemObj.accountId)}
          </span>
        }
      >
        {children}
      </Tree.TreeNode>
    );
  };

  createWebsiteTree = (website: string, arr: any[]): any => {
    if (website === 'default') {
      return (
        <Tree.TreeNode title="Default" key="default">
          {arr
            .flatMap(p => p.problems)
            .map(p => (
              <Tree.TreeNode title={p} />
            ))}
        </Tree.TreeNode>
      );
    } else {
      const children = arr.map(this.createAliasNode);
      return (
        <Tree.TreeNode title={<span className="capitalize">{website}</span>} key={website}>
          {children}
        </Tree.TreeNode>
      );
    }
  };

  filterEmptyTrees(problems: Problems): Problems {
    const filteredProblems: Problems = {};
    Object.keys(problems).forEach(accountId => {
      if (problems[accountId].problems.length) {
        filteredProblems[accountId] = problems[accountId];
      }
    });
    return filteredProblems;
  }
  
  render() {
    const problems = this.filterEmptyTrees(this.props.problems);
    const group = _.groupBy(problems, 'website');
    const websiteNodes = Object.entries(group).map(([key, value]) =>
      this.createWebsiteTree(key, value)
    );
    return <Tree defaultExpandAll>{websiteNodes}</Tree>;
  }
}
