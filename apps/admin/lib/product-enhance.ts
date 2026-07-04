import sharp from "sharp";
import { removeProductBackground } from "./remove-background.server";

const OUTPUT_SIZE = 1024;
const PRODUCT_PADDING = 64;

export async function enhanceProductPhoto(inputBuffer: Buffer): Promise<Buffer> {
  const normalized = await sharp(inputBuffer).rotate().png().toBuffer();
  const cutout = await removeProductBackground(normalized);

  const cutoutMeta = await sharp(cutout).metadata();
  const width = cutoutMeta.width ?? OUTPUT_SIZE;
  const height = cutoutMeta.height ?? OUTPUT_SIZE;
  const maxProductSize = OUTPUT_SIZE - PRODUCT_PADDING * 2;
  const scale = Math.min(maxProductSize / width, maxProductSize / height, 1);
  const productWidth = Math.round(width * scale);
  const productHeight = Math.round(height * scale);

  const productLayer = await sharp(cutout)
    .resize(productWidth, productHeight, { fit: "inside" })
    .png()
    .toBuffer();

  const left = Math.round((OUTPUT_SIZE - productWidth) / 2);
  const top = Math.round((OUTPUT_SIZE - productHeight) / 2);

  return sharp({
    create: {
      width: OUTPUT_SIZE,
      height: OUTPUT_SIZE,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: productLayer, left, top }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}
