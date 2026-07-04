import sharp from 'sharp';

export interface ElaOptions {
  quality?: number;
  scale?: number;
}

/**
 * Performs Error Level Analysis using sharp (libvips-based).
 *
 * Algorithm:
 *  1. Re-compress image as JPEG at target quality.
 *  2. Compute absolute pixel difference per channel.
 *  3. Amplify differences by scale factor.
 */
export async function performEla(inputBuffer: Buffer, options: ElaOptions = {}): Promise<Buffer> {
  const { quality = 75, scale = 10 } = options;

  // Get image metadata
  const metadata = await sharp(inputBuffer).metadata();
  const width = metadata.width!;
  const height = metadata.height!;

  // Decode original to raw RGB
  const originalRaw = await sharp(inputBuffer).removeAlpha().raw().toBuffer();

  // Re-compress to JPEG then decode back to raw RGB
  const recompressedRaw = await sharp(inputBuffer)
    .removeAlpha()
    .jpeg({ quality })
    .toBuffer()
    .then((buf) => sharp(buf).raw().toBuffer());

  // Compute amplified difference
  const pixelCount = width * height * 3;
  const elaRaw = Buffer.alloc(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    const diff = Math.abs(originalRaw[i] - recompressedRaw[i]);
    elaRaw[i] = Math.min(255, diff * scale);
  }

  // Encode result as PNG
  return sharp(elaRaw, {
    raw: {
      width,
      height,
      channels: 3,
    },
  })
    .png()
    .toBuffer();
}
