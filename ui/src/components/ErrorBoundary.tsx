import React from 'react';

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component {
  state: State = {
    hasError: false,
    error: undefined
  };

  static getDerivedStateFromError(error) {
    console.error(error);
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-8">
          <h1>Something went wrong.</h1>
          <code>{this.state.error!.toString()}</code>
          <br />
          <code>{this.state.error!.stack || ''}</code>
        </div>
      );
    }
    return this.props.children;
  }
}
