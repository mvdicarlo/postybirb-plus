const fs = require("fs");
const path = require("path");

if (!process.env.CERT_A || !process.env.CERT_B) {
  console.warn("No SIGNER found.");
} else {
  fs.writeFileSync(
    path.join(__dirname, "electron-app", "signer.pfx"),
    Buffer.from(process.env.CERT_A.concat(process.env.CERT_B), "base64")
  );
  console.log("Signer created.");
}
