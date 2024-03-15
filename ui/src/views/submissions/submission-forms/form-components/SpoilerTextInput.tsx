import React from 'react';
import { Form, Input, Switch } from 'antd';
import { observer } from 'mobx-react';

interface Props {
  label?: string;
  maxLength?: number;
  overwriteDefault?: boolean;
  spoilerText?: string;
  onChangeOverwriteDefault: (overwriteDefault: boolean) => void;
  onChangeSpoilerText: (spoilerText: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface State {}

@observer
export default class SpoilerTextInput extends React.Component<Props, State> {
  state: State = {};

  private overwriteDefault: boolean;
  private spoilerText: string;

  constructor(props: Props) {
    super(props);
    if (props.overwriteDefault === undefined) {
      this.spoilerText = props.spoilerText || '';
      this.overwriteDefault = this.spoilerText.trim() !== '';
      if (this.overwriteDefault) {
        this.props.onChangeOverwriteDefault(true);
      }
    } else {
      this.overwriteDefault = !!props.overwriteDefault;
      this.spoilerText = props.spoilerText || '';
    }
  }

  handleOverwriteDefaultChange = (checked: boolean) => {
    this.overwriteDefault = !checked;
    this.props.onChangeOverwriteDefault(this.overwriteDefault);
    if (!checked && this.props.overwriteDefault) {
      this.handleSpoilerTextChange(this.props.spoilerText || '');
    }
  };

  handleSpoilerTextChange = (spoilerText: string) => {
    this.spoilerText = spoilerText;
    this.props.onChangeSpoilerText(this.spoilerText);
  };

  render() {
    return (
      <Form.Item label={this.props.label || 'Content Warning'}>
        <div>
          <span className="mr-2">
            <Switch
              size="small"
              checked={!this.props.overwriteDefault}
              onChange={this.handleOverwriteDefaultChange}
            />
          </span>
          <span>Use default</span>
        </div>
        {this.props.overwriteDefault && (
          <Input
            value={this.props.spoilerText}
            onChange={e => this.handleSpoilerTextChange(e.target.value)}
            maxLength={this.props.maxLength}
          />
        )}
      </Form.Item>
    );
  }
}
