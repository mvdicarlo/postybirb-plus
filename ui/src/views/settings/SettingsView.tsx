import React from 'react';
import { inject, observer } from 'mobx-react';
import { SettingsStore } from '../../stores/settings.store';
import SettingsService from '../../services/settings.service';
import { Settings } from 'postybirb-commons';
import {
  Form,
  Collapse,
  Switch,
  Tooltip,
  InputNumber,
  Radio,
  Input,
  Typography,
  Button,
  message
} from 'antd';
import { UIStore } from '../../stores/ui.store';
import UpdateService from '../../services/update.service';
import RemoteService from '../../services/remote.service';

interface Props {
  settingsStore?: SettingsStore;
  uiStore?: UIStore;
}

@inject('settingsStore', 'uiStore')
@observer
export default class SettingsView extends React.Component<Props> {
  private updateSetting(key: keyof Settings, value: any) {
    if (
      value === undefined ||
      (value === '' && key !== 'defaultTagSearchProvider') ||
      value === null
    )
      return;
    if (value === this.props.settingsStore!.settings[key]) return;
    SettingsService.updateSetting(key, value);
  }

  private exampleDimensionChange(value: number, height: number, width: number) {
    const percent = (100 - value) / 100;
    return (
      <span>
        A {height} x {width} image would be reduced down to a maximum of {percent * height} x{' '}
        {percent * width}.
      </span>
    );
  }

  render() {
    const settings = this.props.settingsStore!.settings;
    return (
      <Form layout="vertical">
        <Collapse bordered={false}>
          <Collapse.Panel header="Posting" key="posting">
            <Form.Item label="Help Advertise Postybirb">
              <Tooltip
                title={
                  'Adds "Posted using Postybirb" to the end of descriptions for most websites.'
                }
              >
                <Switch
                  checked={settings.advertise}
                  onChange={value => this.updateSetting('advertise', value)}
                />
              </Tooltip>
            </Form.Item>
            <Form.Item label="Clear Queue on Failure">
              <Tooltip title="Clears the posting queue when a post fails.">
                <Switch
                  checked={settings.emptyQueueOnFailedPost}
                  onChange={value => this.updateSetting('emptyQueueOnFailedPost', value)}
                />
              </Tooltip>
            </Form.Item>
            <Form.Item label="Post Retries">
              <Tooltip title="# of times to try posting a submission if a failure happens.">
                <InputNumber
                  min={0}
                  max={2}
                  value={settings.postRetries}
                  onChange={value =>
                    this.updateSetting('postRetries', Math.min(2, Math.max(0, Number(value))))
                  }
                />
              </Tooltip>
            </Form.Item>
            <Form.Item label="Default tagging search provider">
              <Tooltip title="When creating a new post, autocomplete tags from this provider.">
                <Radio.Group
                  value={settings.defaultTagSearchProvider}
                  onChange={event =>
                    this.updateSetting('defaultTagSearchProvider', event.target.value)
                  }
                >
                  <Radio.Button value="none">Do not autocomplete</Radio.Button>
                  <Radio.Button value="artconomy">Artconomy</Radio.Button>
                  <Radio.Button value="e621">e621</Radio.Button>
                </Radio.Group>
              </Tooltip>
            </Form.Item>
          </Collapse.Panel>
          <Collapse.Panel header="Autoscaling" key="autoscaling">
            <p>
              <em>PostyBirb converts .bmp, .tiff to JPEG or PNG (if opacity is detected).</em>
            </p>
            <Form.Item label="PNG">
              <p>
                <em>
                  If file size requirements cannot be met using PNG options, the image will be
                  converted to JPEG.
                </em>
              </p>
              <Form.Item
                label="Max Height / Width Reduction"
                extra={this.exampleDimensionChange(settings.maxPNGSizeCompression, 1000, 1000)}
              >
                <InputNumber
                  min={0}
                  max={99}
                  value={settings.maxPNGSizeCompression}
                  formatter={value => `${value}%`}
                  onChange={value =>
                    this.updateSetting(
                      'maxPNGSizeCompression',
                      Math.min(99, Math.max(0, Number(value)))
                    )
                  }
                />
              </Form.Item>
              <Form.Item
                label="Max Height / Width Reduction (For Images with Opacity)"
                extra={this.exampleDimensionChange(
                  settings.maxPNGSizeCompressionWithAlpha,
                  1000,
                  1000
                )}
              >
                <InputNumber
                  min={0}
                  max={99}
                  value={settings.maxPNGSizeCompressionWithAlpha}
                  formatter={value => `${value}%`}
                  onChange={value =>
                    this.updateSetting(
                      'maxPNGSizeCompressionWithAlpha',
                      Math.min(99, Math.max(0, Number(value)))
                    )
                  }
                />
              </Form.Item>
            </Form.Item>
            <Form.Item label="JPEG">
              <Form.Item
                label="Max Height / Width Reduction"
                extra={this.exampleDimensionChange(settings.maxJPEGSizeCompression, 1000, 1000)}
              >
                <InputNumber
                  min={0}
                  max={99}
                  value={settings.maxJPEGSizeCompression}
                  formatter={value => `${value}%`}
                  onChange={value =>
                    this.updateSetting(
                      'maxJPEGSizeCompression',
                      Math.min(99, Math.max(0, Number(value)))
                    )
                  }
                />
              </Form.Item>
              <Form.Item
                label="Max Image Quality Reduction"
                extra="Size reduction is attempted before quality reduction."
              >
                <InputNumber
                  min={0}
                  max={99}
                  value={settings.maxJPEGQualityCompression}
                  formatter={value => `${value}%`}
                  onChange={value =>
                    this.updateSetting(
                      'maxJPEGQualityCompression',
                      Math.min(99, Math.max(0, Number(value)))
                    )
                  }
                />
              </Form.Item>
            </Form.Item>
          </Collapse.Panel>
          <Collapse.Panel header="Theme" key="theme">
            <Form.Item label="Theme">
              <Radio.Group
                value={this.props.uiStore!.state.theme}
                onChange={value => this.props.uiStore!.changeTheme(value.target.value)}
              >
                <Radio.Button value="light">Light</Radio.Button>
                <Radio.Button value="dark">Dark</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Collapse.Panel>
          <Collapse.Panel header="Notifications" key="notifications">
            <Form.Item label="Make system notifications silent">
              <Switch
                checked={settings.silentNotification}
                onChange={value => this.updateSetting('silentNotification', value)}
              />
            </Form.Item>
          </Collapse.Panel>
          <Collapse.Panel header="Performance" key="performance">
            <Form.Item label="Use hardware acceleration (requires restart)">
              <Switch
                disabled={/Linux/.test(navigator.platform)}
                checked={settings.useHardwareAcceleration}
                onChange={value => this.updateSetting('useHardwareAcceleration', value)}
              />
            </Form.Item>
          </Collapse.Panel>
          <Collapse.Panel header="Startup" key="startup">
            <Form.Item label="Start PostyBirb on startup">
              <Switch
                disabled={/Linux/.test(navigator.platform)}
                checked={settings.openOnLogin}
                onChange={value => this.updateSetting('openOnLogin', value)}
              />
            </Form.Item>
            <Form.Item label="Show PostyBirb Window on application startup">
              <Switch
                checked={settings.openWindowOnStartup}
                onChange={value => this.updateSetting('openWindowOnStartup', value)}
              />
            </Form.Item>
          </Collapse.Panel>
          <Collapse.Panel header="Remote" key="remote">
            <p>
              Connect to a PostyBirb client over the internet/LAN.
              <br />
              <strong>
                Any changes to these settings will require you to refresh the application (ctrl+r or
                application restart).
              </strong>
            </p>
            <Typography.Paragraph copyable={{ text: window.AUTH_ID }}>
              My Authorization Code: <em>{window.AUTH_ID}</em>
            </Typography.Paragraph>
            <Form.Item label="URL" help={`<IP Address>:<Port (default is 9247)>`}>
              <Input
                addonBefore="https://"
                placeholder={`localhost:${window.PORT}`}
                defaultValue={(localStorage.getItem('REMOTE_URI') || '').replace(
                  /http(s){0,1}:\/\//,
                  ''
                )}
                onBlur={({ target }) => {
                  localStorage.setItem(
                    'REMOTE_URI',
                    target.value.trim()
                      ? `https://${target.value.replace(/http(s){0,1}:\/\//, '')}`
                      : ''
                  );
                  this.setState({});
                }}
              />
            </Form.Item>
            <Form.Item
              label="Authorization Code"
              help="Authorization code can be found on the settings page of the client you are connecting to."
            >
              <Input
                placeholder={window.AUTH_ID}
                defaultValue={localStorage.getItem('REMOTE_AUTH') || ''}
                onBlur={({ target }) => {
                  localStorage.setItem('REMOTE_AUTH', target.value);
                  this.setState({});
                }}
              />
            </Form.Item>
            <Form.Item>
              <Button
                disabled={
                  !(!!localStorage.getItem('REMOTE_URI') && !!localStorage.getItem('REMOTE_AUTH'))
                }
                onClick={() =>
                  RemoteService.testConnection()
                    .then(() => {
                      message.success('Test successful.');
                    })
                    .catch(() => {
                      message.error('Test failed.');
                    })
                }
              >
                Test Connection
              </Button>
            </Form.Item>
          </Collapse.Panel>
          <Collapse.Panel header="Proxy" key="proxy">
            <p>
              Usually need when using VPN since requests from PostyBirb does not go throught some
              VPN's by default.
              <br />
              If that happens, you can configure your VPN to listen on local address and then set it here
              <br />
              <strong>
                Any changes to these settings will require you to restart the application.
              </strong>
            </p>
            <Form.Item>
              <Input
                placeholder="http://127.0.0.1:1111"
                onBlur={({ target }) => {
                  this.updateSetting('proxy', target.value)
                }}
              />
            </Form.Item>
          </Collapse.Panel>
          <Collapse.Panel header="Updates" key="updates">
            <Form.Item>
              <Button onClick={() => UpdateService.checkForUpdates()}>Check for updates</Button>
            </Form.Item>
          </Collapse.Panel>
        </Collapse>
      </Form>
    );
  }
}
