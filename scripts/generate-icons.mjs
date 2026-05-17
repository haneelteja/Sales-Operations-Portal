/**
 * Generates all required PWA / Android icon sizes from a single SVG source.
 *
 * Usage:
 *   node scripts/generate-icons.mjs
 *
 * Requires: sharp  (npm install --save-dev sharp)
 * Input:    public/icons/icon-source.svg   (place your master logo here)
 * Output:   public/icons/icon-{size}x{size}.png  for every required size
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceFile = path.join(projectRoot, 'public', 'icons', 'icon-source.svg');
const outputDir  = path.join(projectRoot, 'public', 'icons');

async function main() {
  // Try to load sharp; if not installed, generate SVG placeholders instead
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.warn('sharp not installed — generating SVG placeholder icons instead.');
    console.warn('Run:  npm install --save-dev sharp   then re-run this script for PNG icons.');
    generateSvgPlaceholders();
    return;
  }

  if (!fs.existsSync(sourceFile)) {
    console.error(`Source SVG not found: ${sourceFile}`);
    console.error('Place your master logo at public/icons/icon-source.svg and re-run.');
    generateSvgPlaceholders();
    return;
  }

  for (const size of SIZES) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    await sharp(sourceFile)
      .resize(size, size, { fit: 'contain', background: { r: 30, g: 64, b: 175, alpha: 1 } })
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated ${outputPath}`);
  }
  console.log('\nAll icons generated successfully.');
}

function generateSvgPlaceholders() {
  for (const size of SIZES) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.svg`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#1e40af"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        font-family="system-ui,sans-serif" font-weight="700"
        font-size="${size * 0.38}" fill="#ffffff">A</text>
</svg>`;
    fs.writeFileSync(outputPath, svg, 'utf8');
    console.log(`✓ SVG placeholder: ${outputPath}`);
  }
  console.log('\nSVG placeholders written. Replace with PNGs before submitting to Play Store.');
}

main().catch(console.error);
