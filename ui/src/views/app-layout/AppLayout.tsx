import React from 'react';
import './AppLayout.css';
import AppHeader from '../app-header/AppHeader';
import Home from '../home/Home';
import SubmissionEditForm from '../submissions/SubmissionEditForm';
import SubmissionsView from '../submissions/SubmissionsView';
import TagGroups from '../tag-groups/TagGroups';
import { Link, Route, Prompt } from 'react-router-dom';
import { Login } from '../login/Login';
import SettingsView from '../settings/SettingsView';
import { UIStore } from '../../stores/ui.store';
import { WebsiteRegistry } from '../../website-components/website-registry';
import { inject, observer } from 'mobx-react';
import { Icon, Layout, Menu, Drawer, Select, BackTop } from 'antd';
import DescriptionTemplates from '../description-templates/DescriptionTemplates';

const { Content, Sider } = Layout;

interface Props {
  uiStore?: UIStore;
}

interface State {
  currentNavActive: string;
  accountsVisible: boolean;
  descriptionTemplateVisible: boolean;
  settingsVisible: boolean;
  tagGroupVisible: boolean;
}

@inject('uiStore')
@observer
export default class App extends React.Component<Props, State> {
  public state: any = {
    currentNavActive: '1',
    accountsVisible: false,
    descriptionTemplateVisible: false,
    settingsVisible: false,
    tagGroupVisible: false
  };

  private readonly websites = Object.keys(WebsiteRegistry.websites);

  constructor(props: Props) {
    super(props);
    this.state.currentNavActive = this.getCurrentNavId();
  }

  getCurrentNavId(): string {
    const baseUrl = location.hash; // eslint-disable-line no-restricted-globals
    if (baseUrl.includes('submission')) {
      return 'submissions';
    }

    return 'home';
  }

  handleCollapsedChange = (collapsed: boolean) => {
    this.props.uiStore!.collapseNav(collapsed);
  };

  showDrawer = () => this.setState({ accountsVisible: true });
  hideDrawer = () => this.setState({ accountsVisible: false });

  updateWebsiteFilter = (filtered: string[]) => {
    this.props.uiStore!.changeWebsiteFilter(filtered);
  };

  handleNavSelectChange = ({ key }) => {
    if (key !== '-1') this.setState({ currentNavActive: key });
  };

  render() {
    const { uiStore } = this.props;
    const state = uiStore!.state;
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
            defaultOpenKeys={['templates']}
          >
            <Menu.Item key="home">
              <Link to="/">
                <Icon type="home" />
                <span>Home</span>
              </Link>
            </Menu.Item>
            <Menu.Item key="accounts" onClick={this.showDrawer}>
              <Icon type="user" />
              <span>Accounts</span>
            </Menu.Item>
            <Menu.Item key="submissions">
              <Link to="/submissions">
                <Icon type="upload" />
                <span>Submissions</span>
              </Link>
            </Menu.Item>
            <Menu.SubMenu
              key="templates"
              title={
                <span>
                  <Icon type="snippets" />
                  Templates
                </span>
              }
            >
              <Menu.Item key="tag-groups">
                <span onClick={() => this.setState({ tagGroupVisible: true })}>
                  <Icon type="tags" />
                  <span>Tag Groups</span>
                </span>
              </Menu.Item>

              <Menu.Item key="description-templates" onClick={() => this.setState({ descriptionTemplateVisible: true })}>
                <span>
                  <span>
                    <i aria-label="icon: description-template" className="anticon description-template">
                      <svg
                        viewBox="0 0 20 20"
                        focusable="false"
                        data-icon="description-template"
                        width="1em"
                        height="1em"
                        fill="currentColor"
                        aria-hidden={true}
                      >
                        <path d="M19 19v-1H5v1h14zM9 16v-4a5 5 0 1 1 6 0v4h4a2 2 0 0 1 2 2v3H3v-3c0-1.1.9-2 2-2h4zm4 0v-5l.8-.6a3 3 0 1 0-3.6 0l.8.6v5h2z"></path>
                      </svg>
                    </i>
                  </span>
                  <span>Description</span>
                </span>
              </Menu.Item>
            </Menu.SubMenu>
            <Menu.Item key="setting" onClick={() => this.setState({ settingsVisible: true })}>
              <span>
                <Icon type="setting" />
                <span>Settings</span>
              </span>
            </Menu.Item>
          </Menu>
          <Drawer
            title="Tag Groups"
            visible={this.state.tagGroupVisible}
            destroyOnClose={true}
            onClose={() => this.setState({ tagGroupVisible: false })}
            width="50vw"
          >
            <TagGroups />
          </Drawer>
          <Drawer
            title="Description Templates"
            visible={this.state.descriptionTemplateVisible}
            destroyOnClose={true}
            onClose={() => this.setState({ descriptionTemplateVisible: false })}
            width="50vw"
          >
            <DescriptionTemplates />
          </Drawer>
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
                    defaultValue={this.props.uiStore!.websiteFilter}
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
            width="50vw"
            visible={this.state.accountsVisible}
            onClose={this.hideDrawer}
          >
            <Login />
          </Drawer>
          <Drawer
            title="Settings"
            visible={this.state.settingsVisible}
            onClose={() => this.setState({ settingsVisible: false })}
            destroyOnClose={true}
            width="100vw"
          >
            <SettingsView />
          </Drawer>
        </Sider>

        <Layout>
          <div className="header container">
            <AppHeader />
          </div>
          <Content className="container primary-layout-container">
            <div className="pt-3 px-3 h-full overflow-y-auto" id="primary-container">
              <Route exact path="/" component={Home} />
              <Route path="/submissions" component={SubmissionsView} />
              <Route path="/edit/submission/:id" component={SubmissionEditForm} />
              <BackTop target={() => document.getElementById('primary-container') || window} />
              <Prompt
                when={this.props.uiStore!.state.hasPendingChanges}
                message="Are you sure you want to navigate? Any unsaved changes will be lost."
              />
            </div>
          </Content>
        </Layout>
      </Layout>
    );
  }
}
