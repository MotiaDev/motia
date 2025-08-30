#!/bin/bash
# Pre-commit hook for Motia projects

echo "🔍 Running pre-commit checks..."

# 1. Check for console.log statements
if grep -r "console\.log" --include="*.ts" --include="*.js" steps/ 2>/dev/null; then
  echo "❌ Found console.log statements. Use logger instead."
  exit 1
fi

# 2. Run TypeScript check
if command -v tsc &> /dev/null; then
  echo "📝 Checking TypeScript..."
  tsc --noEmit
  if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors found"
    exit 1
  fi
fi

# 3. Run linting
if command -v eslint &> /dev/null; then
  echo "🧹 Running ESLint..."
  eslint steps/**/*.{ts,js}
  if [ $? -ne 0 ]; then
    echo "❌ Linting errors found"
    exit 1
  fi
fi

# 4. Check for hardcoded secrets
echo "🔐 Checking for secrets..."
if grep -r "sk-[a-zA-Z0-9]" --include="*.ts" --include="*.js" --include="*.py" steps/ 2>/dev/null; then
  echo "❌ Found potential API keys. Use environment variables."
  exit 1
fi

# 5. Validate step configs
echo "✅ Validating step configurations..."
node -e "
const fs = require('fs');
const path = require('path');

function validateSteps(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      validateSteps(fullPath);
    } else if (file.name.endsWith('.step.ts') || file.name.endsWith('.step.js')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check for required exports
        if (!content.includes('export const config')) {
          console.error(\`❌ Missing config export in \${fullPath}\`);
          process.exit(1);
        }
        
        if (!content.includes('export const handler')) {
          console.error(\`❌ Missing handler export in \${fullPath}\`);
          process.exit(1);
        }
      } catch (error) {
        console.error(\`❌ Error reading \${fullPath}: \${error.message}\`);
        process.exit(1);
      }
    }
  }
}

try {
  validateSteps('./steps');
  console.log('✅ All step configurations valid');
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}
"

echo "✅ All pre-commit checks passed!"