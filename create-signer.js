const fs = require("fs");
const path = require("path");

if (!process.env.CERT_A || !process.env.CERT_B || !process.env.CERT_C || !process.env.CERT_D) {
  console.warn("No SIGNER found.");
} else {
  fs.writeFileSync(
    path.join(__dirname, "electron-app", "signer.pfx"),
    Buffer.from(process.env.CERT_A.concat(process.env.CERT_B).concat(process.env.CERT_C).concat(process.env.CERT_D), "base64")
  );
  console.log("Signer created.", process.env.CERT_A.concat(process.env.CERT_B).concat(process.env.CERT_C).concat(process.env.CERT_D).length);
}
