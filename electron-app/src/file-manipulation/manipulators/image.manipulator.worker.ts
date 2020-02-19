const Jimp = require('jimp');
const fs = require('fs-extra');

// Clean up self after 30 minutes (since no process should really be used that long)
setTimeout(() => {
  process.exit(1);
}, 60000 * 30);

let manipulator = null; // JIMP
process.on('message', async msg => {
  let hasChanges = false;
  try {
    let { convertOnAlpha, location, quality, type, width, originalType } = msg;
    if (!manipulator) {
      manipulator = await Jimp.read(location);
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
    if (type !== originalType) {
      hasChanges = true;
    }
    if (convertOnAlpha && originalType !== Jimp.MIME_JPEG && !clone.hasAlpha()) {
      type = Jimp.MIME_JPEG;
      hasChanges = true;
    }

    if (hasChanges) {
      const tmpLocation = `${location.split('.tmp')[0]}-${Date.now()}.tmp`;
      await fs.writeFile(tmpLocation, await clone.getBufferAsync(type));
      process.send({ success: true, data: { location: tmpLocation, type } });
    } else {
      process.send({ success: true, data: { location: null, type: null } });
    }
  } catch (err) {
    process.send({ success: false, err: err.message });
  }
});
