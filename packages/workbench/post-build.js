#!/usr/bin/env node
/**
 * Post-build script for Workbench
 * Cross-platform replacement for post-build.sh
 *
 * This script:
 * 1. Copies required files to dist/
 * 2. Copies directories recursively
 * 3. Replaces main.tsx with main.js in index.html
 */

const fs = require('fs');
const path = require('path');

// Utility: Copy file
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log(`✓ Copied: ${src} -> ${dest}`);
}

// Utility: Copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
  console.log(`✓ Copied directory: ${src} -> ${dest}`);
}

// Utility: Replace text in file
function replaceInFile(filePath, searchValue, replaceValue) {
  if (!fs.existsSync(filePath)) {
    console.error(`✗ File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(new RegExp(searchValue, 'g'), replaceValue);
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`✓ Replaced "${searchValue}" with "${replaceValue}" in ${filePath}`);
}

// Main execution
try {
  console.log('🚀 Running post-build script...\n');

  // Step 1: Copy individual files
  console.log('📄 Copying files...');
  copyFile('README.md', 'dist/README.md');
  copyFile('index.html', 'dist/index.html');
  copyFile('components.json', 'dist/components.json');
  copyFile('src/index.css', 'dist/src/index.css');
  copyFile('src/components/tutorial/tutorial.css', 'dist/src/components/tutorial/tutorial.css');
  copyFile('tailwind.config.js', 'dist/tailwind.config.js');
  copyFile('postcss.config.mjs', 'dist/postcss.config.mjs');

  console.log('\n📁 Copying directories...');
  // Step 2: Copy directories recursively
  copyDir('public', 'dist/public');
  copyDir('src/assets', 'dist/src/assets');

  console.log('\n🔄 Replacing TSX to JS references...');
  // Step 3: Replace main.tsx with main.js in dist/index.html
  replaceInFile('dist/index.html', 'main\\.tsx', 'main.js');

  console.log('\n✅ Post-build completed successfully!\n');
} catch (error) {
  console.error('\n❌ Post-build failed:', error.message);
  process.exit(1);
}
