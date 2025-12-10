import React from 'react';
import ReactDOM from 'react-dom';
import { LoginDialogProps } from '../interfaces/website.interface';
import { Spin } from 'antd';

interface State {
  loading: boolean;
}

export class GenericLoginDialog extends React.Component<LoginDialogProps, State> {
  state: State = {
    loading: false
  };

  componentDidMount() {
    const node = ReactDOM.findDOMNode(this);
    if (node instanceof HTMLElement) {
      const view: any = node.querySelector('.webview');
    }
  }

  render() {
    return (
      <div className="h-full w-full">
        <Spin wrapperClassName="full-size-spinner" spinning={this.state.loading}>
          <webview src={this.props.url} className="webview h-full w-full" webpreferences="nativeWindowOpen=1" allowpopups={'true' as any} partition={`persist:${this.props.account._id}`} />
        </Spin>
      </div>
    );
  }
}
