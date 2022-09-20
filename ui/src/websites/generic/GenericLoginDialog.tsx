import React from 'react';
import ReactDOM from 'react-dom';
import { LoginDialogProps } from '../interfaces/website.interface';
import { Spin } from 'antd';

interface State {
  loading: boolean;
}

export class GenericLoginDialog extends React.Component<LoginDialogProps, State> {
  state: State = {
    loading: true
  };

  componentDidMount() {
    const node = ReactDOM.findDOMNode(this);
    if (node instanceof HTMLElement) {
      const view: any = node.querySelector('.webview');
      view.addEventListener('did-stop-loading', () => {
        if (this.state.loading) this.setState({ loading: false });
      });
      view.allowpopups = true;
      view.partition = `persist:${this.props.account._id}`;
      view.src = this.props.url;
    }
  }

  render() {
    return (
      <div className="h-full w-full">
        <Spin wrapperClassName="full-size-spinner" spinning={this.state.loading}>
          <webview className="webview h-full w-full" />
        </Spin>
      </div>
    );
  }
}
