import React from 'react';
import './AppLayout.css';
import AppHeader from '../app-header/AppHeader';
import AppUpdate from '../update/AppUpdate';
import DescriptionTemplates from '../description-templates/DescriptionTemplates';
import Home from '../home/Home';
import SettingsView from '../settings/SettingsView';
import SubmissionEditForm from '../submissions/forms/SubmissionEditForm';
import SubmissionsView from '../submissions/SubmissionsView';
import SubmissionTemplates from '../submission-templates/SubmissionTemplates';
import TagGroups from '../tag-groups/TagGroups';
import SubmissionTemplateEditForm from '../submissions/forms/SubmissionTemplateEditForm';
import { Link, Route, Prompt } from 'react-router-dom';
import { Login } from '../login/Login';
import { SubmissionType } from '../../shared/enums/submission-type.enum';
import { UIStore } from '../../stores/ui.store';
import { WebsiteRegistry } from '../../website-components/website-registry';
import { inject, observer } from 'mobx-react';
import {
  Icon,
  Layout,
  Menu,
  Drawer,
  Select,
  BackTop,
  ConfigProvider,
  Modal,
  Tabs,
  message
} from 'antd';

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
    currentNavActive: 'home',
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
    if (baseUrl.includes(SubmissionType.FILE)) {
      return 'file-submissions';
    }

    if (baseUrl.includes(SubmissionType.NOTIFICATION)) {
      return 'notification-submissions';
    }

    if (baseUrl.includes('submission-template')) {
      return 'submission-template';
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

  getDiscordIcon() {
    return (
      <svg height="1em" width="1em" viewBox="0 0 245 240">
        <path
          fill="#FFFFFF"
          d="M104.4 103.9c-5.7 0-10.2 5-10.2 11.1s4.6 11.1 10.2 11.1c5.7 0 10.2-5 10.2-11.1.1-6.1-4.5-11.1-10.2-11.1zM140.9 103.9c-5.7 0-10.2 5-10.2 11.1s4.6 11.1 10.2 11.1c5.7 0 10.2-5 10.2-11.1s-4.5-11.1-10.2-11.1z"
        />
        <path
          fill="#FFFFFF"
          d="M189.5 20h-134C44.2 20 35 29.2 35 40.6v135.2c0 11.4 9.2 20.6 20.5 20.6h113.4l-5.3-18.5 12.8 11.9 12.1 11.2 21.5 19V40.6c0-11.4-9.2-20.6-20.5-20.6zm-38.6 130.6s-3.6-4.3-6.6-8.1c13.1-3.7 18.1-11.9 18.1-11.9-4.1 2.7-8 4.6-11.5 5.9-5 2.1-9.8 3.5-14.5 4.3-9.6 1.8-18.4 1.3-25.9-.1-5.7-1.1-10.6-2.7-14.7-4.3-2.3-.9-4.8-2-7.3-3.4-.3-.2-.6-.3-.9-.5-.2-.1-.3-.2-.4-.3-1.8-1-2.8-1.7-2.8-1.7s4.8 8 17.5 11.8c-3 3.8-6.7 8.3-6.7 8.3-22.1-.7-30.5-15.2-30.5-15.2 0-32.2 14.4-58.3 14.4-58.3 14.4-10.8 28.1-10.5 28.1-10.5l1 1.2c-18 5.2-26.3 13.1-26.3 13.1s2.2-1.2 5.9-2.9c10.7-4.7 19.2-6 22.7-6.3.6-.1 1.1-.2 1.7-.2 6.1-.8 13-1 20.2-.2 9.5 1.1 19.7 3.9 30.1 9.6 0 0-7.9-7.5-24.9-12.7l1.4-1.6s13.7-.3 28.1 10.5c0 0 14.4 26.1 14.4 58.3 0 0-8.5 14.5-30.6 15.2z"
        />
      </svg>
    );
  }

  getKofiIcon() {
    return (
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
    );
  }

  render() {
    const { uiStore } = this.props;
    const state = uiStore!.state;
    message.config({ prefixCls: `ant-${this.props.uiStore!.state.theme}-message` });
    return (
      <ConfigProvider prefixCls={`ant-${this.props.uiStore!.state.theme}`}>
        <Modal
          title="User Agreement"
          visible={!this.props.uiStore!.state.agreementAccepted}
          destroyOnClose={true}
          maskClosable={false}
          closable={false}
          cancelText="No"
          onOk={() => this.props.uiStore!.agreementAccepted()}
          onCancel={window.electron.kill}
        >
          <Tabs>
            <Tabs.TabPane tab="Terms of Use" key="tou">
              <p>
                By using PostyBirb you agree to the Terms of Service and Rules of the websites that
                you are posting to.
              </p>
              <p>
                <strong>You are responsible for everything you post.</strong>
              </p>
            </Tabs.TabPane>
            <Tabs.TabPane tab="License" key="license">
              <p className="text-justify">
                THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
                EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
                OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
                SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
                INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
                TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR
                BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
                CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
                ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
                DAMAGE.
              </p>
            </Tabs.TabPane>
          </Tabs>
        </Modal>
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
              defaultOpenKeys={['submissions', 'templates']}
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
              <Menu.SubMenu
                key="submissions"
                title={
                  <span>
                    <Icon type="upload" />
                    <span>Submissions</span>
                  </span>
                }
              >
                <Menu.Item key="file-submissions">
                  <Link to={`/${SubmissionType.FILE}`}>
                    <Icon type="file" />
                    <span>File</span>
                  </Link>
                </Menu.Item>

                <Menu.Item key="notification-submissions">
                  <Link to={`/${SubmissionType.NOTIFICATION}`}>
                    <Icon type="notification" />
                    <span>Notification</span>
                  </Link>
                </Menu.Item>
              </Menu.SubMenu>

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
                <Menu.Item
                  key="tag-groups"
                  onClick={() => this.setState({ tagGroupVisible: true })}
                >
                  <span>
                    <Icon type="tags" />
                    <span>Tag Groups</span>
                  </span>
                </Menu.Item>
                <Menu.Item key="submission-templates">
                  <Link to="/submission-templates">
                    <Icon type="form" />
                    <span>Submission</span>
                  </Link>
                </Menu.Item>
              </Menu.SubMenu>

              <Menu.Item
                key="discord"
                onClick={() =>
                  window.electron.shell.openInBrowser('https://discordapp.com/invite/jK5JQJF')
                }
              >
                <Icon component={this.getDiscordIcon.bind(this)} />
                <span>Discord</span>
              </Menu.Item>

              <Menu.Item
                key="donate"
                onClick={() => window.electron.shell.openInBrowser('http://ko-fi.com/A81124JD')}
              >
                <Icon component={this.getKofiIcon.bind(this)} />
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
                <Route path={`/${SubmissionType.FILE}`} component={SubmissionsView} />
                <Route path={`/${SubmissionType.NOTIFICATION}`} component={SubmissionsView} />
                <Route path={'/submission-templates'} component={SubmissionTemplates} />
                <Route path="/edit/submission/:id" component={SubmissionEditForm} />
                <Route
                  path="/edit/submission-template/:id"
                  component={SubmissionTemplateEditForm}
                />
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
