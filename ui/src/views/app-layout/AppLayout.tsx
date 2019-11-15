import React from 'react';
import { Icon, Layout, Menu, Drawer, Select } from 'antd';
import { inject, observer } from 'mobx-react';
import { Link, Route, Switch } from 'react-router-dom';
import { UIStore } from '../../stores/ui.store';
import Home from '../home/Home';
import SubmissionsView from '../submissions/SubmissionsView';
import AppHeader from '../app-header/AppHeader';
import './AppLayout.css';
import { Login } from '../login/Login';
import { WebsiteRegistry } from '../../website-components/website-registry';

const { Content, Sider } = Layout;

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

  private readonly websites = Object.keys(WebsiteRegistry.websites);

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

  updateWebsiteFilter = (filtered: string[]) => {
    this.props.uiStore.changeWebsiteFilter(filtered);
  };

  handleNavSelectChange = ({ key }) => {
    if (key !== '-1') this.setState({ currentNavActive: key });
  };

  render() {
    const { state } = this.props.uiStore;
    return (
      <Layout
        style={{
          height: '100vh'
        }}
      >
        <Sider collapsible collapsed={state.navCollapsed} onCollapse={this.handleCollapsedChange}>
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
            <Menu.Item key="-1" onClick={this.showDrawer}>
              <Icon type="user" />
              <span>Accounts</span>
            </Menu.Item>
            <Menu.Item key="3">
              <Link to="/submissions">
                <Icon type="upload" />
                <span>Submissions</span>
              </Link>
            </Menu.Item>
          </Menu>
          <Drawer
            title={
              <div className="inline-flex w-4/5">
                <div className="flex-1 mr-1">Accounts</div>
                <div className="w-full">
                  <Select
                    mode="multiple"
                    size="small"
                    placeholder="Hide websites"
                    style={{ width: '100%' }}
                    defaultValue={this.props.uiStore.websiteFilter}
                    onChange={this.updateWebsiteFilter}
                    allowClear={true}
                  >
                    {this.websites.map(website => (
                      <Select.Option key={website}>{website}</Select.Option>
                    ))}
                  </Select>
                </div>
              </div>
            }
            width={'50vw'}
            visible={this.state.accountsVisible}
            onClose={this.hideDrawer}
          >
            <Login />
          </Drawer>
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
