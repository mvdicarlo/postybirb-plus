import React from 'react';
import './AppLayout.css';
import '../../services/ui-notification.service';
import AppHeader from '../app-header/AppHeader';
import AppUpdate from '../update/AppUpdate';
import DescriptionTemplates from '../description-templates/DescriptionTemplates';
import Home from '../home/Home';
import SettingsView from '../settings/SettingsView';
import SubmissionEditForm from '../submissions/submission-forms/forms/SubmissionEditForm';
import SubmissionsView from '../submissions/SubmissionsView';
import SubmissionTemplates from '../submission-templates/SubmissionTemplates';
import TagGroups from '../tag-groups/TagGroups';
import SubmissionTemplateEditForm from '../submissions/submission-forms/forms/SubmissionTemplateEditForm';
import MultiSubmissionEditForm from '../submissions/submission-forms/forms/MultiSubmissionEditForm';
import { Link, Route, Prompt } from 'react-router-dom';
import { Login } from '../login/Login';
import { SubmissionType } from 'postybirb-commons';
import { UIStore } from '../../stores/ui.store';
import { WebsiteRegistry } from '../../websites/website-registry';
import { inject, observer } from 'mobx-react';
import { KofiIcon, DiscordIcon } from './SvgIcons';
import NotificationsView from '../notifications/NotificationsView';
import CustomShortcuts from '../custom-shortcuts/CustomShortcuts';
import TagConverters from '../tag-converters/TagConverters';
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
import ErrorBoundary from '../../components/ErrorBoundary';

const { Content, Sider } = Layout;

interface Props {
  uiStore?: UIStore;
}

interface State {
  accountsVisible: boolean;
  descriptionShortcutsVisible: boolean;
  descriptionTemplateVisible: boolean;
  settingsVisible: boolean;
  tagGroupVisible: boolean;
  tagConverterVisible: boolean;
}

@inject('uiStore')
@observer
export default class AppLayout extends React.Component<Props, State> {
  public state: any = {
    accountsVisible: false,
    descriptionShortcutsVisible: false,
    descriptionTemplateVisible: false,
    settingsVisible: false,
    tagGroupVisible: false,
    tagConverterVisible: false
  };

  private readonly websites = Object.keys(WebsiteRegistry.websites);

  constructor(props: Props) {
    super(props);
    props.uiStore!.setActiveNav(this.getCurrentNavId());
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
    this.props.uiStore!.setActiveNav(key);
  };

  render() {
    const { uiStore } = this.props;
    const state = uiStore!.state;
    message.config({
      duration: 2,
      maxCount: 2
    });
    this.props.uiStore!.setActiveNav(this.getCurrentNavId());
    return (
      <ConfigProvider>
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
        <Layout className="h-screen">
          <Sider collapsible collapsed={state.navCollapsed} onCollapse={this.handleCollapsedChange}>
            <div className="layout-header">
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
              <div className="update-container text-center mx-1">
                <AppUpdate />
              </div>
            </div>

            <Menu
              mode="inline"
              theme="dark"
              selectedKeys={[this.props.uiStore!.state.activeNav]}
              onSelect={this.handleNavSelectChange}
              defaultOpenKeys={state.navCollapsed ? [] : ['submissions', 'templates']}
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
              <Menu.Item key="notifications">
                <NotificationsView />
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
                  key="custom-shortcuts"
                  onClick={() => this.setState({ descriptionShortcutsVisible: true })}
                >
                  <span>
                    <Icon type="pic-right" />
                    <span>Shortcuts</span>
                  </span>
                </Menu.Item>
                <Menu.Item
                  key="tag-converters"
                  onClick={() => this.setState({ tagConverterVisible: true })}
                >
                  <span>
                    <Icon type="share-alt" />
                    <span>Tag Converters</span>
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
                <Icon component={DiscordIcon} />
                <span>Discord</span>
              </Menu.Item>

              <Menu.Item
                key="donate"
                onClick={() => window.electron.shell.openInBrowser('http://ko-fi.com/A81124JD')}
              >
                <Icon component={KofiIcon} />
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
              title="Tag Converters"
              visible={this.state.tagConverterVisible}
              destroyOnClose={true}
              onClose={() => this.setState({ tagConverterVisible: false })}
              width="50vw"
            >
              <TagConverters />
            </Drawer>
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
              title="Custom Description Shortcuts"
              visible={this.state.descriptionShortcutsVisible}
              destroyOnClose={true}
              onClose={() => this.setState({ descriptionShortcutsVisible: false })}
              width="50vw"
            >
              <CustomShortcuts />
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
                      className="w-full"
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
              <div className="px-3 h-full overflow-y-auto bg-inherit" id="primary-container">
                <ErrorBoundary>
                  <Route exact path="/" component={Home} />
                  <Route path={`/${SubmissionType.FILE}/:view?`} component={SubmissionsView} />
                  <Route path={`/${SubmissionType.NOTIFICATION}`} component={SubmissionsView} />
                  <Route path={'/submission-templates'} component={SubmissionTemplates} />
                  <Route path="/edit/submission/:type/:id" component={SubmissionEditForm} />
                  <Route
                    path="/edit/multiple-submissions/:id"
                    component={MultiSubmissionEditForm}
                  />
                  <Route
                    path="/edit/submission-template/:id"
                    component={SubmissionTemplateEditForm}
                  />
                  <BackTop target={() => document.getElementById('primary-container') || window} />
                  <Prompt
                    when={this.props.uiStore!.state.hasPendingChanges}
                    message="Are you sure you want to navigate? Any unsaved changes will be lost."
                  />
                </ErrorBoundary>
              </div>
            </Content>
          </Layout>
        </Layout>
      </ConfigProvider>
    );
  }
}
