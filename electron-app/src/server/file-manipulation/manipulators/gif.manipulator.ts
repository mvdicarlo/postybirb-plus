const Jimp = require('jimp');

export class GifManipulator {
  static async getFrame(fileBuffer: Buffer): Promise<Buffer> {
    const gif = await Jimp.read(fileBuffer);
    return await gif.getBufferAsync(Jimp.MIME_PNG);
  }
}
