import React from 'react';
import { notification } from 'antd';

const BrowserLink: React.FC<{ url: string }> = props => {
  return (
    <a
      href={props.url}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        window.electron.shell.openInBrowser(props.url).catch(() =>
          notification.error({
            message: 'Browser Failure',
            description: `PostyFox was unable to open ${props.url}`
          })
        );
      }}
    >
      {props.children}
    </a>
  );
};

export default BrowserLink;
