const sharp = require('sharp')
const fs = require('fs/promises')
const path = require('path')

async function generateImages() {
  // Define paths
  const publicDir = path.join(process.cwd(), 'public')
  const svgIconPath = path.join(publicDir, 'Favicon_48X48.ico')

  try {
    // Check if favicon.svg exists
    await fs.access(svgIconPath)
  } catch (error) {
    console.error('Error: Favicon_48X48.ico not found in public directory.', error)
    return // Exit if the source SVG is not found
  }

  // Create public directory if it doesn't exist.
  await fs.mkdir(publicDir, { recursive: true })

  // Read the SVG file content.
  const svgBuffer = await fs.readFile(svgIconPath)

  // Define desired sizes.
  const sizes = {
    'favicon-16x16.png': 16,
    'favicon-32x32.png': 32,
    'favicon-48x48.png': 48,
    'android-icon-192x192.png': 192,
    'apple-icon.png': 180,
    'icon.png': 512,
  }

  for (const [filename, size] of Object.entries(sizes)) {
    await sharp(svgBuffer, { density: 300 })
      .resize({
        width: size,
        height: size,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(path.join(publicDir, filename))

    console.log(`Generated ${filename}`)
  }

  // Generate favicon.ico at 32x32 pixels.
  await sharp(svgBuffer, { density: 300 })
    .resize({
      width: 32,
      height: 32,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toFile(path.join(publicDir, 'favicon.ico'))

  console.log('Generated favicon.ico')
  console.log('✅ All images generated successfully')
}

generateImages().catch(console.error)
