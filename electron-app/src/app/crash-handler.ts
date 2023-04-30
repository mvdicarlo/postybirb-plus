import { crashReporter } from 'electron';

crashReporter.start({
  companyName: 'PostyFox',
  submitURL: '',
  uploadToServer: false,
});
