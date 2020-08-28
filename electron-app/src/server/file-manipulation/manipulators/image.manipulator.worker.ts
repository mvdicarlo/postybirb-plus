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
    let { convertOnAlpha, location, quality, type, resizePx, originalType, scalePercent } = msg;
    if (!manipulator) {
      manipulator = await Jimp.read(location);
    }
    const clone = manipulator.clone();
    if (resizePx) {
      const ar = clone.bitmap.width / clone.bitmap.height;
      if (ar >= 1) {
        if (resizePx < clone.bitmap.width) {
          clone.resize(resizePx, Jimp.AUTO);
          hasChanges = true;
        }
      } else {
        if (resizePx < clone.bitmap.height) {
          clone.resize(Jimp.AUTO, resizePx);
          hasChanges = true;
        }
      }
    }
    if (scalePercent && scalePercent !== 1) {
      clone.scale(scalePercent);
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
