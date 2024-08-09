const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { version } = require('./package.json');
const { parse, stringify } = require('yaml');

const BASE_PATH = path.join(__dirname, 'release');
const SETUP_PATH = path.join(BASE_PATH, `postybirb-plus-setup-${version}.exe`);
const YAML_PATH = path.join(BASE_PATH, `latest.yml`);

function hashFile(file, algorithm = 'sha512', encoding = 'base64', options) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    hash.on('error', reject).setEncoding(encoding);
    fs.createReadStream(
      file,
      Object.assign({}, options, {
        highWaterMark: 1024 * 1024,
        /* better to use more memory but hash faster */
      }),
    )
      .on('error', reject)
      .on('end', () => {
        hash.end();
        resolve(hash.read());
      })
      .pipe(hash, {
        end: false,
      });
  });
}

hashFile(SETUP_PATH).then(hash => {
  console.log(hash);
  const yaml = parse(fs.readFileSync(YAML_PATH, 'utf8'));
  yaml.sha512 = hash;
  yaml.files[0].sha512 = hash;
  console.log(stringify(yaml));
  fs.writeFileSync(YAML_PATH, stringify(yaml));
});
