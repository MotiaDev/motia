# RFC: Installation Time Optimization

## Status
- **RFC Date**: 2025-01-27
- **Status**: Draft
- **Authors**: Glauber Castro
- **Reviewers**: Motia Team

## Summary

This RFC proposes optimizations to reduce the installation time of Motia projects, specifically when running `npx motia create`. The current installation process takes 34-66 seconds and downloads 26-30MB of dependencies, with the largest bottlenecks being Redis compilation (30-60s), Monaco Editor (13MB), and unnecessary runtime dependencies. This RFC identifies 7 key issues and proposes solutions that could reduce installation time by 34-66 seconds and download size by 26-30MB (~97% reduction in some cases).

## Background

Currently, Motia projects are created via `npx motia create`, which installs all dependencies during the initial setup. The installation process includes:

- **Redis Memory Server**: Downloads and compiles Redis binaries during `npm install` (30-60 seconds)
- **Monaco Editor**: Full IDE editor dependency (13MB tarball) used only for JSON editing
- **TypeScript & TypeScript-ESLint**: Included in runtime dependencies despite not being needed at runtime
- **Version Mismatches**: Multiple versions of `date-fns` and `lucide-react` causing duplication
- **Redundant Dependencies**: `ts-node` installed in user projects even though it's already in motia
- **Build Tools in Runtime**: Vite, TailwindCSS, PostCSS in dependencies instead of devDependencies

However, users face challenges with:

- **Slow First-Time Experience**: 30-60 second delays during project creation, especially on slower machines
- **CI/CD Performance**: Slower build times and increased costs in continuous integration pipelines
- **Unnecessary Downloads**: Large dependencies downloaded even when not immediately needed
- **Developer Experience**: Degraded experience due to unnecessary waiting during installation

The workbench uses a hybrid architecture where middleware is pre-built, but Vite runs at runtime for development. Key insight: Vite uses esbuild internally for TypeScript transformation, which doesn't require the TypeScript package at runtime.

## Goals

### Primary Goals

1. **Reduce Installation Time**: Decrease `npx motia create` installation time by 50-90% (from 34-66s to 5-10s)
2. **Reduce Download Size**: Decrease total download size by 50-90% (from 26-30MB to 3-5MB)
3. **Eliminate Unnecessary Compilation**: Remove Redis compilation from installation process
4. **Optimize Dependency Management**: Move build-time tools to devDependencies where appropriate
5. **Maintain Backward Compatibility**: Ensure all changes are non-breaking and maintain existing functionality

### Secondary Goals

1. **Improve Developer Experience**: Faster project setup for new users
2. **Reduce CI/CD Costs**: Lower build times and resource usage
3. **Better Dependency Alignment**: Eliminate version mismatches and duplication
4. **Future-Proof Architecture**: Design for easier maintenance and updates

### Non-Goals

- Breaking changes to user-facing APIs
- Changes to runtime behavior or functionality
- Modifications to the core Motia framework architecture
- Removal of features or capabilities

## Architecture Overview

### Current Installation Flow

```
npx motia create
    │
    ├─► npm install (34-66s)
    │   ├─► Redis compilation (30-60s) ⚠️
    │   ├─► Monaco Editor download (13MB) ⚠️
    │   ├─► TypeScript download (4.2MB) ⚠️
    │   ├─► Duplicate dependencies ⚠️
    │   └─► Build tools in runtime deps ⚠️
    │
    └─► Project ready
```

### Proposed Installation Flow

```
npx motia create
    │
    ├─► npm install (5-10s) ✅
    │   ├─► Core dependencies only
    │   ├─► No Redis compilation (lazy-loaded)
    │   ├─► CodeMirror instead of Monaco (370KB vs 13MB)
    │   ├─► TypeScript in devDeps only
    │   └─► Aligned versions (no duplication)
    │
    └─► Project ready
```

### Dependency Optimization Strategy

```
Current State:
├─ Runtime Dependencies (unnecessary)
│  ├─ typescript (4.2MB)
│  ├─ typescript-eslint
│  ├─ vite (1-2MB + deps)
│  ├─ tailwindcss
│  └─ postcss
│
└─ Heavy Dependencies
   ├─ redis-memory-server (compiles during install)
   ├─ monaco-editor (13MB)
   └─ date-fns (duplicated versions)

Proposed State:
├─ Runtime Dependencies (minimal)
│  └─ Only truly runtime dependencies
│
├─ Dev Dependencies (build-time only)
│  ├─ typescript
│  ├─ typescript-eslint
│  ├─ vite
│  ├─ tailwindcss
│  └─ postcss
│
└─ Optimized Dependencies
   ├─ redis-memory-server (lazy-loaded)
   ├─ codemirror (370KB vs 13MB)
   └─ date-fns (removed, custom utility)
```

## Detailed Design

### 1. Redis Memory Server Lazy-Loading

**Problem**: Redis binaries are compiled during `npm install` even when users never run the server.

**Solution**: Move `redis-memory-server` to `optionalDependencies` and use dynamic import.

**Implementation**:
```typescript
// packages/snap/src/redis-memory-manager.ts
let RedisMemoryServer: any = null

async function loadRedisMemoryServer() {
  if (!RedisMemoryServer) {
    try {
      const module = await import('redis-memory-server')
      RedisMemoryServer = module.RedisMemoryServer
    } catch (error) {
      throw new Error(
        'Redis Memory Server is required but not installed. ' +
        'Install it with: npm install redis-memory-server'
      )
    }
  }
  return RedisMemoryServer
}

async function start(...) {
  const RedisMemoryServerClass = await loadRedisMemoryServer()
  this.server = new RedisMemoryServerClass({...})
}
```

**Package.json Changes**:
```json
{
  "optionalDependencies": {
    "redis-memory-server": "^0.14.0"
  }
}
```

**Impact**: Saves 30-60 seconds during installation, ~5-10MB download

### 2. Monaco Editor Replacement

**Problem**: Monaco Editor (13MB) is overkill for simple JSON editing needs.

**Solution**: Replace with CodeMirror 6 (370KB total).

**Implementation**:
```json
{
  "dependencies": {
    "@codemirror/lang-json": "^6.0.1",
    "@codemirror/state": "^6.4.0",
    "@codemirror/view": "^6.34.0",
    "@codemirror/theme-one-dark": "^6.1.2"
  }
}
```

**Component Updates**:
- Update `JsonEditor` components in workbench, plugin-states, and plugin-endpoint
- CodeMirror provides JSON syntax highlighting, validation, and themes
- Similar API surface, minimal code changes required

**Impact**: Saves 12.6MB download (~97% reduction), 1.5-2 seconds

### 3. TypeScript to devDependencies

**Problem**: TypeScript (4.2MB) is in runtime dependencies but not needed at runtime.

**Why It's Safe**:
- Vite uses esbuild internally for TypeScript transpilation
- esbuild has its own built-in TypeScript parser (doesn't use the `typescript` package)
- No direct imports of `typescript` in workbench runtime code
- TypeScript package is only for type checking, `.d.ts` generation, and IDE support

**Solution**: Move `typescript` and `typescript-eslint` to `devDependencies`.

**Package.json Changes**:
```json
{
  "devDependencies": {
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.47.0"
  }
}
```

**Impact**: Saves 4.2MB+ download, 0.5-1 second

### 4. date-fns Removal

**Problem**: Multiple versions of `date-fns` (3.0-3.1MB) causing duplication.

**Solution**: Create lightweight `formatDistanceToNow` utility in `@motiadev/ui` and remove `date-fns` from all plugins.

**Implementation**:
```typescript
// packages/ui/src/lib/date.ts
export function formatDistanceToNow(
  date: Date | number,
  options?: { addSuffix?: boolean }
): string {
  // Custom implementation matching date-fns behavior
}
```

**Impact**: Saves 3MB download, eliminates version conflicts

### 5. lucide-react Version Alignment

**Problem**: Multiple versions across packages causing potential duplication.

**Solution**: Align all packages to `^0.555.0`.

**Package.json Changes**: Update all `package.json` files to use consistent version.

**Impact**: Eliminates duplication, ensures single version installation

### 6. ts-node Removal from Create Script

**Problem**: `ts-node` is installed in user projects even though it's already in motia.

**Solution**: Remove from create script's devDependencies.

**Code Changes**:
```typescript
// Before
const devDependencies = ['ts-node@10.9.2', 'typescript@5.7.3', '@types/react@19.1.1'].join(' ')

// After
const devDependencies = ['typescript@5.7.3', '@types/react@19.1.1'].join(' ')
```

**Impact**: Saves 2-3MB download, 0.3 seconds

### 7. Vite/TailwindCSS to devDependencies

**Problem**: Build tools in runtime dependencies.

**Solution**: Pre-build workbench assets and move build tools to devDependencies.

**Architecture**:
1. Build workbench React app at package build time using Vite
2. Serve pre-built static files at runtime
3. Use lightweight esbuild for plugin bundling only
4. Move Vite/TailwindCSS/PostCSS to `devDependencies`

**Impact**: Saves 1-2MB + transitive deps, 1-2 seconds

## Success Metrics

### Technical Success

- **Installation Time**: Reduce from 34-66s to 5-10s (70-85% reduction)
- **Download Size**: Reduce from 26-30MB to 3-5MB (80-90% reduction)
- **Dependency Count**: Eliminate duplicate dependencies
- **Build Time**: No increase in package build time

### User Experience Success

- **First-Time Experience**: Faster project creation
- **CI/CD Performance**: Reduced build times and costs
- **Developer Satisfaction**: Improved developer experience metrics
- **Error Rate**: No increase in installation errors

### Implementation Success

- **Backward Compatibility**: 100% maintained
- **Test Coverage**: All changes covered by tests
- **Documentation**: Updated to reflect changes
- **Rollout**: Smooth deployment without issues

### Summary Table

| Issue | Current Impact | Solution | Estimated Savings | Priority |
|-------|----------------|----------|-------------------|----------|
| Redis compilation | 30-60s (compile time) | Lazy-load | 30-60s | P0 |
| Monaco Editor | 13MB download | Replace with CodeMirror 6 | 12.6MB, ~1.5-2s | P0 |
| TypeScript in deps | 4.2MB download | Move to devDeps | 4.2MB, ~0.5s | P1 |
| date-fns mismatch | 3MB download (duplicated) | Custom utility | 3MB, ~0.4s | P1 |
| lucide-react mismatch | 3.2MB (duplicated) | Align versions | Eliminates duplication | P1 |
| ts-node redundancy | 2-3MB download | Remove from create | 2-3MB, ~0.3s | P2 |
| Vite/TailwindCSS in deps | 1-2MB + deps | Pre-build workbench | 1-2MB, ~1-2s | P2 |
| **TOTAL** | **~26-30MB, ~34-66s** | **All fixes** | **~26-30MB, ~34-66s** | |

**Note**: Download sizes are from npm tarballs (`.tgz` files). Extracted `node_modules` sizes are larger but don't affect installation time.

## Conclusion

This RFC proposes comprehensive optimizations to reduce Motia installation time and download size by 70-90%. The changes are incremental, maintain backward compatibility, and can be implemented in phases based on risk assessment. The primary benefits include faster project creation, reduced CI/CD costs, and improved developer experience. All proposed solutions are technically sound and have been verified for safety where applicable.

---

## References

- [Vite Documentation - esbuild](https://vitejs.dev/guide/features.html#esbuild)
- [esbuild - TypeScript Support](https://esbuild.github.io/content-types/#typescript)
- [CodeMirror 6 Documentation](https://codemirror.net/)
- [Monaco Editor Bundle Size Optimization](https://github.com/microsoft/monaco-editor/blob/main/webpack-plugin/README.md)
- [npm tarball sizes](https://www.npmjs.com/) - Verified via `npm pack` and `npm view`
