const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceImage = path.join(__dirname, '../client/public/favicon.png');
const outputDir = path.join(__dirname, '../client/public/images');

async function generateIcons() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `pwa-icon-${size}.png`);
    await sharp(sourceImage)
      .resize(size, size, {
        fit: 'cover',
        background: { r: 10, g: 10, b: 10, alpha: 1 }
      })
      .png()
      .toFile(outputPath);
    console.log(`Generated: pwa-icon-${size}.png`);
  }
  
  console.log('All PWA icons generated successfully!');
}

generateIcons().catch(console.error);
