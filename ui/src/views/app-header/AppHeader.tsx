import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import { PageHeader, Breadcrumb, Icon } from 'antd';
import { HeaderStore, HeaderState, BreadcrumbNavItem } from '../../stores/header.store';

interface Props {
  headerStore?: HeaderStore;
  history?: any;
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
class AppHeader extends React.Component<any | Props, any> {
  render() {
    const headerState: HeaderState = this.props.headerStore.headerState;
    return (
      <PageHeader
        title={headerState.title}
        subTitle={headerState.subtitle}
        onBack={() => this.props.history!.goBack()}
      >
        <div className="flex">
          <div style={{ flex: 10 }}>
            <Breadcrumb routes={headerState.routes} itemRender={BreadcrumbNav} />
          </div>
        </div>
      </PageHeader>
    );
  }
}

export default withRouter(AppHeader);
