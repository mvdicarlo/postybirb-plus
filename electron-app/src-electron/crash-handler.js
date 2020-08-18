const { crashReporter } = require('electron');

crashReporter.start({
  companyName: 'PostyBirb',
  submitURL: '',
  uploadToServer: false,
});
