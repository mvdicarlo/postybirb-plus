import * as forge from 'node-forge';
import * as fs from 'fs-extra';
import { app } from 'electron';
import * as path from 'path';

(forge as any).options.usePureJavaScript = true;

export class SSL {
  static getOrCreate(): { key: any; cert: any } {
    if (fs.existsSync(path.join(app.getPath('userData'), 'data', 'cert.pem'))) {
        console.log('ssl exists')
      return {
        key: fs.readFileSync(path.join(app.getPath('userData'), 'data', 'key.pem')),
        cert: fs.readFileSync(path.join(app.getPath('userData'), 'data', 'cert.pem')),
      };
    }

    const pki = forge.pki;
    var keys = pki.rsa.generateKeyPair(2048);
    var cert = pki.createCertificate();

    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);

    var attrs = [
      { name: 'commonName', value: 'postybirb.com' },
      { name: 'countryName', value: 'US' },
      { shortName: 'ST', value: 'Virginia' },
      { name: 'localityName', value: 'Fairfax' },
      { name: 'organizationName', value: 'PostyBirb' },
      { shortName: 'OU', value: 'PostyBirb' },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey);

    const pem_privateKey = forge.pki.privateKeyToPem(keys.privateKey);
    const pem_cert = pki.certificateToPem(cert);

    fs.writeFile(path.join(app.getPath('userData'), 'data', 'cert.pem'), pem_cert);
    fs.writeFile(path.join(app.getPath('userData'), 'data', 'key.pem'), pem_privateKey);

    return { cert: pem_cert, key: pem_privateKey };
  }
}
