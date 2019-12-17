import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { HashRouter as Router } from 'react-router-dom';
import * as serviceWorker from './serviceWorker';

import './styles/light.css';
import './styles/dark.css';
import './styles/submission.css';
import './styles/scrollbar.css';
import './styles/tailwind.css';

declare global {
  interface Window {
    electron: {
      clipboard: {
        availableFormats: () => string[];
        read: () => File;
      };
      shell: {
        openInBrowser(url: string): Promise<void>;
      };
      kill: () => void;
    };
    PORT: number;
    appVersion: string;
  }
}

ReactDOM.render(
  <Router basename="/">
    <App />
  </Router>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls. Learn
// more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
