import React from 'react';
import { inject, observer } from 'mobx-react';
import { SettingsStore } from '../../stores/settings.store';
import SettingsService from '../../services/settings.service';
import { Settings } from '../../../../electron-app/src/settings/interfaces/settings.interface';
import { Form, Collapse, Switch, Tooltip, InputNumber, Input, Radio } from 'antd';
import { UIStore } from '../../stores/ui.store';

interface Props {
  settingsStore?: SettingsStore;
  uiStore?: UIStore;
}

@inject('settingsStore', 'uiStore')
@observer
export default class SettingsView extends React.Component<Props> {
  private updateSetting(key: keyof Settings, value: any) {
    if (value === undefined || value === '' || value === null) return;
    SettingsService.updateSetting(key, value);
  }

  render() {
    const settings = this.props.settingsStore!.settings;
    return (
      <Form layout="vertical">
        <Collapse bordered={false}>
          <Collapse.Panel header="Posting" key="1">
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
                  max={5}
                  value={settings.postRetries}
                  onBlur={({ target }) =>
                    this.updateSetting('postRetries', Math.max(0, Number(target.value)))
                  }
                />
              </Tooltip>
            </Form.Item>
            <Form.Item label="Time Between Posts">
              <Tooltip title="# of minutes between each post.">
                <InputNumber
                  min={0}
                  value={settings.postInterval}
                  onBlur={({ target }) =>
                    this.updateSetting('postInterval', Math.max(0, Number(target.value)))
                  }
                />
              </Tooltip>
            </Form.Item>
          </Collapse.Panel>
          <Collapse.Panel header="Display" key="2">
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
          <Collapse.Panel header="Performance" key="3">
            <Form.Item label="Use hardware acceleration">
              <Switch
                disabled={/Linux/.test(navigator.platform)}
                checked={settings.useHardwareAcceleration}
                onChange={value => this.updateSetting('useHardwareAcceleration', value)}
              />
            </Form.Item>
          </Collapse.Panel>
          <Collapse.Panel header="Startup" key="4">
            <Form.Item label="Open PostyBirb on application startup">
              <Switch
                checked={settings.openOnStartup}
                onChange={value => this.updateSetting('openOnStartup', value)}
              />
            </Form.Item>
          </Collapse.Panel>
          <Collapse.Panel header="Performance" key="5">
            <Form.Item label="Use hardware acceleration (requires restart)">
              <Switch
                disabled={/Linux/.test(navigator.platform)}
                checked={settings.useHardwareAcceleration}
                onChange={value => this.updateSetting('useHardwareAcceleration', value)}
              />
            </Form.Item>
          </Collapse.Panel>
          <Collapse.Panel header="Remote" key="6">
            <Form.Item
              label="Remote PostyBirb (requires restart)"
              extra={
                <p>
                  URI for PostyBirb to use for API calls.
                  <br />
                  SHOULD ONLY BE USED FOR CONNECTING TO A POSTYBIRB ON A REMOTE SERVER.
                  <br />
                  HTTPS SHOULD BE ENFORCED BY SERVER AS THIS MAY EXPOSE OAUTH DATA KEYS ACROSS
                  UNENCRYPTED CHANNELS.
                </p>
              }
            >
              <Tooltip title="Remote URI">
                <Input
                  defaultValue={this.props.uiStore!.state.remoteURI}
                  onBlur={({ target }) => this.props.uiStore!.setRemoteURI(target.value)}
                  placeholder={`http://localhost:${window.PORT}`}
                />
              </Tooltip>
            </Form.Item>
          </Collapse.Panel>
        </Collapse>
      </Form>
    );
  }
}
