import React from 'react';
import { Link } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import { PageHeader, Breadcrumb, Icon } from 'antd';
import {
  HeaderStore,
  HeaderState,
  BreadcrumbNavItem
} from '../../stores/header.store';

interface Props {
  headerStore?: HeaderStore;
}

const BreadcrumbNav: React.SFC<BreadcrumbNavItem> = props => {
  const icon = props.icon ? <Icon type={props.icon} /> : '';
  return (
    <Link to={props.path}>
      {icon}
      <span>{props.breadcrumbName}</span>
    </Link>
  );
};

@inject('headerStore')
@observer
export default class AppHeader extends React.Component<any | Props, any> {
  render() {
    const headerState: HeaderState = this.props.headerStore.headerState;
    return (
      <PageHeader
        title={headerState.title}
        subTitle={headerState.subtitle}
      >
        <Breadcrumb
          routes={headerState.routes}
          itemRender={BreadcrumbNav}
        ></Breadcrumb>
      </PageHeader>
    );
  }
}
