import { Icon, Layout, Menu, Drawer } from 'antd';
import { inject, observer } from 'mobx-react';
import React from 'react';
import { Link, Route, Switch } from 'react-router-dom';
import { UIStore } from '../../stores/ui.store';
import Home from '../home/Home';
import SubmissionsView from '../submissions/SubmissionsView';
import AppHeader from '../app-header/AppHeader';
import './AppLayout.css';

const { Header, Content, Sider } = Layout;

interface Props {
  uiStore?: UIStore;
}

interface State {
  currentNavActive: string;
  accountsVisible: boolean;
}

@inject('uiStore')
@observer
export default class App extends React.Component<any | Props, State> {
  public state: any = {
    currentNavActive: '1',
    accountsVisible: false
  };

  constructor(props: Props) {
    super(props);
    this.state.currentNavActive = this.getCurrentNavId();
  }

  getCurrentNavId(): string {
    const baseUrl = location.hash.split('/')[1]; // eslint-disable-line no-restricted-globals
    switch (baseUrl) {
      case 'submissions':
        return '3';
      default:
        return '1';
    }
  }

  handleCollapsedChange = (collapsed: boolean) => {
    this.props.uiStore.collapseNav(collapsed);
  };

  showDrawer = () => this.setState({ accountsVisible: true });
  hideDrawer = () => this.setState({ accountsVisible: false });

  handleNavSelectChange = ({ key }) => this.setState({ currentNavActive: key });

  render() {
    const { state } = this.props.uiStore;
    return (
      <Layout
        style={{
          height: '100vh'
        }}
      >
        <Sider
          collapsible
          collapsed={state.navCollapsed}
          onCollapse={this.handleCollapsedChange}
        >
          <Link to="/">
            <div
              className="logo"
              style={{
                backgroundImage: `url("${process.env.PUBLIC_URL}/assets/icons/minnowicon.png")`
              }}
            >
              PostyBirb
            </div>
          </Link>
          <Menu
            theme={state.theme}
            mode="inline"
            selectedKeys={[this.state.currentNavActive]}
            onSelect={this.handleNavSelectChange}
          >
            <Menu.Item key="1">
              <Link to="/">
                <Icon type="home" />
                <span>Home</span>
              </Link>
            </Menu.Item>
            <Menu.Item key="2" onClick={this.showDrawer}>
              <Icon type="user" />
              <span>Accounts</span>
              <Drawer
                title="Accounts"
                visible={this.state.accountsVisible}
                onClose={this.hideDrawer}
                maskClosable={true}
                closable={true}
              >
                <div>Hello!</div>
              </Drawer>
            </Menu.Item>
            <Menu.Item key="3">
              <Link to="/submissions">
                <Icon type="upload" />
                <span>Submissions</span>
              </Link>
            </Menu.Item>
          </Menu>
        </Sider>

        <Layout>
          <Content className="container primary-layout-container">
            <div className="header">
              <AppHeader />
            </div>
            <div className="pt-3">
              <Switch>
                <Route exact path="/" component={Home} />
                <Route path="/submissions" component={SubmissionsView} />
              </Switch>
            </div>
          </Content>
        </Layout>
      </Layout>
    );
  }
}
