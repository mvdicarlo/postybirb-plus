import React from 'react';
import ReactDOM from 'react-dom';
import { LoginDialogProps } from '../interfaces/website.interface';

export class GenericLoginDialog extends React.Component<LoginDialogProps, any> {

    componentDidMount() {
        const node = ReactDOM.findDOMNode(this);
        if (node instanceof HTMLElement) {
            const view = node.querySelector('.webview');
            console.log(view);
        }
    }

    render() {
        return <div className="h-full w-full">
            <webview className="webview h-full w-full" webpreferences="nativeWindowOpen=1" allowpopups />
        </div>;
    }
}