import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#ef6c00"/>
  <text x="256" y="340" text-anchor="middle" font-size="280" font-weight="bold" font-family="Arial" fill="white">PM</text>
</svg>`;

async function create() {
  await sharp(Buffer.from(svgContent)).resize(192, 192).png().toFile(path.join(dir, 'icon-192.png'));
  await sharp(Buffer.from(svgContent)).resize(512, 512).png().toFile(path.join(dir, 'icon-512.png'));
  console.log('Iconos PNG creados');
}
create().catch(console.error);
