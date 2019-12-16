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
import { Icon, Layout, Menu, Drawer, Select, BackTop, ConfigProvider } from 'antd';
import DescriptionTemplates from '../description-templates/DescriptionTemplates';
import AppUpdate from '../update/AppUpdate';

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
      <ConfigProvider prefixCls={`ant-${this.props.uiStore!.state.theme}`}>
        <Layout
          style={{
            height: '100vh'
          }}
        >
          <Sider collapsible collapsed={state.navCollapsed} onCollapse={this.handleCollapsedChange}>
            <div>
              <Link to="/">
                <div
                  className="logo"
                  style={{
                    backgroundImage: `url("${process.env.PUBLIC_URL}/assets/icons/minnowicon.png")`
                  }}
                >
                  PostyBirb
                  <span className="text-xs">{window.appVersion}</span>
                </div>
              </Link>
              <div className="text-center mx-1">
                <AppUpdate />
              </div>
            </div>

            <Menu
              mode="inline"
              theme="dark"
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
                    <span>Templates</span>
                  </span>
                }
              >
                <Menu.Item
                  key="tag-groups"
                  onClick={() => this.setState({ tagGroupVisible: true })}
                >
                  <span>
                    <Icon type="tags" />
                    <span>Tag Groups</span>
                  </span>
                </Menu.Item>

                <Menu.Item
                  key="description-templates"
                  onClick={() => this.setState({ descriptionTemplateVisible: true })}
                >
                  <span>
                    <span>
                      <i
                        aria-label="icon: description-template"
                        className="anticon description-template"
                      >
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

              <Menu.Item
                key="donate"
                onClick={() => window.electron.shell.openInBrowser('http://ko-fi.com/A81124JD')}
              >
                <Icon
                  component={() => (
                    <svg width="1em" height="1em" viewBox="0 0 644.8401 410.86875">
                      <g id="layer1" transform="translate(-37.579964,-135.49927)">
                        <g transform="matrix(1.1421528,0,0,-1.1421528,265.93398,460.73095)">
                          <g>
                            <path
                              fill="#ffffff"
                              fillOpacity="1"
                              fillRule="nonzero"
                              stroke="none"
                              d="m 0,0 c -19.946,-2.492 -36.151,-0.622 -36.151,-0.622 l 0,122.132 38.02,0 c 0,0 42.385,-11.839 42.385,-56.704 C 44.254,23.68 23.063,7.478 0,0 M 105.063,85.739 C 88.435,173.56 0.624,184.473 0.624,184.473 l -393.333,0 c -12.99,0 -14.588,-17.148 -14.588,-17.148 0,0 -1.752,-157.43 -0.481,-254.112 3.524,-52.093 55.597,-57.435 55.597,-57.435 0,0 177.701,0.52 257.2,1.039 52.41,9.181 57.674,55.155 57.155,80.3 93.527,-5.196 159.515,60.8 142.889,148.622"
                              transform="matrix(1.0944245,0,0,1.0944245,246.85536,82.861446)"
                            />
                            <path
                              fill="#ff5f5f"
                              fillOpacity="1"
                              fillRule="nonzero"
                              stroke="none"
                              d="m 0,0 c 4.445,-2.238 7.285,0.543 7.285,0.543 0,0 65.045,59.367 94.348,93.557 26.063,30.586 27.762,82.129 -16.997,101.388 -44.758,19.258 -81.584,-22.657 -81.584,-22.657 -31.935,35.123 -80.268,33.345 -102.623,9.575 -22.354,-23.77 -14.548,-64.568 2.129,-87.274 15.655,-21.314 84.465,-82.644 94.894,-93.016 0,0 0.76,-0.795 2.548,-2.116"
                            />
                          </g>
                        </g>
                      </g>
                    </svg>
                  )}
                />
                <span>Donate</span>
              </Menu.Item>

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
      </ConfigProvider>
    );
  }
}
