#!/usr/bin/env node
/**
 * Automated fix for Issue #787: Build Fails on Windows
 *
 * This script automatically replaces Unix-specific commands in all package.json files
 * with cross-platform alternatives.
 *
 * Replacements:
 * - rm -rf  → rimraf
 * - mkdir -p → mkdirp
 * - cp → cpy
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Find all package.json files (excluding node_modules)
async function findPackageJsonFiles() {
  const files = await glob('**/package.json', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    absolute: true
  });
  return files;
}

// Fix a single package.json file
function fixPackageJson(filePath) {
  console.log(`\n📄 Processing: ${filePath}`);

  const content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  let modified = false;
  let newContent = content;

  // Fix 1: Replace rm -rf with rimraf
  if (newContent.includes('rm -rf')) {
    console.log('  ✓ Replacing "rm -rf" with "rimraf"');
    newContent = newContent.replace(/rm -rf /g, 'rimraf ');
    modified = true;
  }

  // Fix 2: Replace mkdir -p with mkdirp
  if (newContent.includes('mkdir -p')) {
    console.log('  ✓ Replacing "mkdir -p" with "mkdirp"');
    newContent = newContent.replace(/mkdir -p /g, 'mkdirp ');
    modified = true;
  }

  // Fix 3: Replace simple cp commands with cpy
  // Pattern: cp src/path/*.ext dest/path
  const cpPattern = /cp ([^\s&|;]+\/\*\.\w+) ([^\s&|;]+)/g;
  if (cpPattern.test(newContent)) {
    console.log('  ✓ Replacing "cp" with "cpy"');
    newContent = newContent.replace(cpPattern, (match, src, dest) => {
      return `cpy '${src}' ${dest}`;
    });
    modified = true;
  }

  // Fix 4: Replace cp -r with cpy
  if (newContent.includes('cp -r')) {
    console.log('  ✓ Replacing "cp -r" with "cpy"');
    // This is more complex, might need manual review
    console.log('  ⚠️  Warning: cp -r found, may need manual review');
  }

  // Fix 5: Replace sh script.sh with node script.js
  const shPattern = /sh ([^\s&|;]+\.sh)/g;
  if (shPattern.test(newContent)) {
    console.log('  ✓ Found "sh script.sh" - consider converting to Node.js');
    console.log('  ⚠️  Manual conversion recommended for shell scripts');
  }

  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('  ✅ File updated');
    return true;
  } else {
    console.log('  ⏭️  No changes needed');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting automated fix for Windows build issues (#787)\n');
  console.log('This will replace Unix commands in package.json files with cross-platform alternatives.\n');

  try {
    const packageJsonFiles = await findPackageJsonFiles();
    console.log(`Found ${packageJsonFiles.length} package.json files\n`);

    let fixedCount = 0;

    for (const file of packageJsonFiles) {
      if (fixPackageJson(file)) {
        fixedCount++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Completed! Fixed ${fixedCount} out of ${packageJsonFiles.length} files`);
    console.log(`${'='.repeat(60)}\n`);

    console.log('📝 Next steps:');
    console.log('1. Review the changes with: git diff');
    console.log('2. Install dependencies: pnpm install');
    console.log('3. Test build: pnpm build');
    console.log('4. Commit changes if everything works\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { fixPackageJson, findPackageJsonFiles };
