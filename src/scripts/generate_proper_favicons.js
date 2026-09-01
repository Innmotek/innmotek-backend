const sharp = require('d:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2/innmotek-backend-NEW/node_modules/sharp');
const fs = require('fs');
const path = require('path');

const srcLogo = 'd:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2/innmotek-frontend-NEW/public/images/logo-gold.png';

async function makeIconsForProject(projectDir, isNextApp = true) {
  const pubDir = path.join(projectDir, 'public');
  if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

  const appDir = path.join(projectDir, 'src', 'app');

  // Load and trim transparency around logo to get the actual symbol
  const trimmed = sharp(srcLogo).trim();
  const trimmedBuffer = await trimmed.toBuffer();

  const sizes = [
    { name: 'favicon-16x16.png', size: 16, pad: 1 },
    { name: 'favicon-32x32.png', size: 32, pad: 2 },
    { name: 'apple-touch-icon.png', size: 180, pad: 12 },
    { name: 'icon-192.png', size: 192, pad: 14 },
    { name: 'icon-512.png', size: 512, pad: 32 },
  ];

  for (const item of sizes) {
    const iconSize = item.size - (item.pad * 2);
    const resizedInner = await sharp(trimmedBuffer)
      .resize(iconSize, iconSize, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const finalImage = await sharp({
      create: {
        width: item.size,
        height: item.size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{ input: resizedInner, gravity: 'center' }])
    .png()
    .toFile(path.join(pubDir, item.name));

    console.log(`Generated ${item.name} (${item.size}x${item.size}) in ${path.relative('d:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2', pubDir)}`);
  }

  // Create favicon.ico (32x32 PNG container)
  const ico32 = await sharp(trimmedBuffer)
    .resize(28, 28, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 32,
      height: 32,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{ input: ico32, gravity: 'center' }])
  .png()
  .toFile(path.join(pubDir, 'favicon.ico'));

  // If Next.js app, also place icon.png and apple-icon.png in src/app for App Router auto-discovery
  if (isNextApp && fs.existsSync(appDir)) {
    fs.copyFileSync(path.join(pubDir, 'favicon-32x32.png'), path.join(appDir, 'icon.png'));
    fs.copyFileSync(path.join(pubDir, 'apple-touch-icon.png'), path.join(appDir, 'apple-icon.png'));
    fs.copyFileSync(path.join(pubDir, 'favicon.ico'), path.join(appDir, 'favicon.ico'));
    console.log(`App Router icons added to ${path.relative('d:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2', appDir)}`);
  }
}

async function run() {
  console.log('Generating crisp square favicons for all 3 projects...');
  await makeIconsForProject('d:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2/innmotek-frontend-NEW', true);
  await makeIconsForProject('d:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2/innmotek-admin', true);
  await makeIconsForProject('d:/Businesses/Agency-BrandNest/Websites-V2/Innmotek-V2/innmotek-backend-NEW', false);
  console.log('Finished generating all favicons.');
}

run().catch(console.error);
