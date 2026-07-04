import Jimp from 'jimp';

export interface ElaOptions {
  quality?: number;
  scale?: number;
}

export async function performEla(inputBuffer: Buffer, options: ElaOptions = {}): Promise<Buffer> {
  const { quality = 75, scale = 10 } = options;

  const original = await Jimp.read(inputBuffer);
  const recompressedBuffer = await original.clone().quality(quality).getBuffer('image/jpeg');
  const recompressed = await Jimp.read(recompressedBuffer);

  const width = original.bitmap.width;
  const height = original.bitmap.height;
  const elaImage = new Jimp({ width, height, color: 0x000000ff });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const origColor = original.getPixelColor(x, y);
      const recompColor = recompressed.getPixelColor(x, y);

      const origR = (origColor >> 24) & 0xff;
      const origG = (origColor >> 16) & 0xff;
      const origB = (origColor >> 8) & 0xff;

      const recompR = (recompColor >> 24) & 0xff;
      const recompG = (recompColor >> 16) & 0xff;
      const recompB = (recompColor >> 8) & 0xff;

      const diffR = Math.min(255, Math.abs(origR - recompR) * scale);
      const diffG = Math.min(255, Math.abs(origG - recompG) * scale);
      const diffB = Math.min(255, Math.abs(origB - recompB) * scale);

      const newColor =
        ((diffR & 0xff) << 24) | ((diffG & 0xff) << 16) | ((diffB & 0xff) << 8) | 0xff;
      elaImage.setPixelColor(newColor, x, y);
    }
  }

  return elaImage.getBuffer('image/png');
}
