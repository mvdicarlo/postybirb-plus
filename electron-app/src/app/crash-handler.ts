import { crashReporter } from 'electron';

crashReporter.start({
  companyName: 'PostyBirb',
  submitURL: '',
  uploadToServer: false,
});
