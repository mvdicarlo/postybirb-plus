const Jimp = require('jimp');
const fs = require('fs-extra');
// Think of way to track children

let manipulator = null; // JIMP
let buf = null;

process.on('message', async msg => {
  let hasChanges = false;
  try {
    let { location, quality, type, width } = msg;
    if (!manipulator) {
      buf = await fs.readFile(location);
      manipulator = await Jimp.read(buf);
    }
    const clone = manipulator.clone();
    if (width && width < clone.bitmap.width) {
      clone.resize(width, Jimp.AUTO);
      hasChanges = true;
    }
    if (quality !== 100) {
      clone.quality(quality);
      hasChanges = true;
    }
    if (!clone.hasAlpha()) {
      type = Jimp.MIME_JPEG;
      hasChanges = true;
    }
    if (hasChanges) {
      const buffer = await clone.getBufferAsync(type);
      process.send({ code: 'SUCCESS', data: { buffer: buffer.toString('base64'), type } });
    } else {
      process.send({ code: 'SUCCESS', data: { buffer: buf.toString('base64'), type } });
    }
  } catch (err) {
    process.send({ code: 'ERROR', err: err.message });
  }
});
