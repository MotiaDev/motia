import type { Express, NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import type { WorkbenchPlugin } from './motia-plugin/types'

export type ApplyMiddlewareParams = {
  app: Express
  port: number
  workbenchBase: string
  plugins: WorkbenchPlugin[]
}

/**
 * Check if pre-built client assets exist.
 * If they do, we're in production mode and use static serving.
 * If not, we're in development mode and use Vite middleware.
 */
function hasPrebuiltAssets(): boolean {
  const clientDir = path.join(__dirname, 'client')
  const manifestPath = path.join(clientDir, '.vite', 'manifest.json')
  return fs.existsSync(manifestPath)
}

/**
 * Development middleware using Vite for HMR and live compilation.
 */
async function applyDevMiddleware({ app, port, workbenchBase, plugins }: ApplyMiddlewareParams) {
  // Dynamic imports for dev dependencies (may not be installed in production)
  const viteModule = await import('vite')
  const createViteServer = viteModule.createServer
  const reactPlugin = await import('@vitejs/plugin-react')
  const react = reactPlugin.default
  const motiaPluginModule = await import('./motia-plugin')
  const motiaPluginsPlugin = motiaPluginModule.default
  const coreModule = await import('@motiadev/core')
  const Printer = coreModule.Printer

  const printer = new Printer(process.cwd())
  printer.printPluginLog('Starting workbench in development mode (Vite HMR)')

  const workbenchBasePlugin = (workbenchBase: string) => ({
    name: 'html-transform-base',
    transformIndexHtml: (html: string) => {
      return html.replace('</head>', `<script>const workbenchBase = ${JSON.stringify(workbenchBase)};</script></head>`)
    },
  })

  const processCwdPlugin = () => ({
    name: 'html-transform-cwd',
    transformIndexHtml: (html: string) => {
      const cwd = process.cwd().replace(/\\/g, '/')
      return html.replace('</head>', `<script>const processCwd = "${cwd}";</script></head>`)
    },
  })

  const reoPlugin = () => ({
    name: 'html-transform-reo',
    transformIndexHtml(html: string) {
      const isAnalyticsEnabled = process.env.MOTIA_ANALYTICS_DISABLED !== 'true'
      if (!isAnalyticsEnabled) return html
      return html.replace(
        '</head>',
        `
        <script type="text/javascript">
          !function(){var e,t,n;e="d8f0ce9cae8ae64",t=function(){Reo.init({clientID:"d8f0ce9cae8ae64", source: "internal"})},(n=document.createElement("script")).src="https://static.reo.dev/"+e+"/reo.js",n.defer=!0,n.onload=t,document.head.appendChild(n)}();
        </script>
    </head>`,
      )
    },
  })

  const vite = await createViteServer({
    appType: 'spa',
    root: __dirname,
    base: workbenchBase,
    server: {
      middlewareMode: true,
      allowedHosts: true,
      host: true,
      hmr: { port: 21678 + port },
      fs: {
        allow: [
          __dirname,
          path.join(process.cwd(), './steps'),
          path.join(process.cwd(), './src'),
          path.join(process.cwd(), './tutorial'),
          path.join(process.cwd(), './node_modules'),
          path.join(__dirname, './node_modules'),
        ],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/assets': path.resolve(__dirname, './src/assets'),
        'lucide-react/dynamic': 'lucide-react/dynamic.mjs',
        'lucide-react': 'lucide-react/dist/cjs/lucide-react.js',
      },
    },
    plugins: [
      react(),
      processCwdPlugin(),
      reoPlugin(),
      motiaPluginsPlugin(plugins),
      workbenchBasePlugin(workbenchBase),
    ],
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.ico', '**/*.webp', '**/*.avif'],
  })

  app.use(workbenchBase, vite.middlewares)
  app.use(`${workbenchBase}/*`, async (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl
    try {
      const index = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')
      const html = await vite.transformIndexHtml(url, index)
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      next(e)
    }
  })
}

/**
 * Production middleware using pre-built assets and esbuild for plugins.
 */
async function applyProdMiddleware({ app, workbenchBase, plugins }: ApplyMiddlewareParams) {
  const coreModule = await import('@motiadev/core')
  const Printer = coreModule.Printer
  const printer = new Printer(process.cwd())
  printer.printPluginLog('Starting workbench in production mode (pre-built assets)')

  const { bundlePlugins, watchPlugins } = await import('./plugin-bundler')
  const expressModule = await import('express')
  const express = expressModule.default || expressModule

  const clientDir = path.join(__dirname, 'client')
  const pluginsOutputDir = path.join(clientDir, '_plugins')

  // Read build manifest
  const manifestPath = path.join(clientDir, '.vite', 'manifest.json')
  const manifest: Record<string, { file: string; css?: string[] }> = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

  // Bundle plugins using esbuild
  const pluginResult =
    plugins.length > 0
      ? await bundlePlugins({
          plugins,
          outputDir: pluginsOutputDir,
          workbenchBase,
          processCwd: process.cwd(),
        })
      : null

  // Watch plugins for changes
  if (pluginResult) {
    await watchPlugins(
      {
        plugins,
        outputDir: pluginsOutputDir,
        workbenchBase,
        processCwd: process.cwd(),
      },
      () => printer.printPluginLog('Plugins rebuilt'),
    )
  }

  // Get main entry from manifest
  const mainEntry = manifest['index.html']
  if (!mainEntry) throw new Error('Main entry not found in manifest')

  const mainJs = mainEntry.file
  const mainCss = mainEntry.css || []
  const processCwd = process.cwd().replace(/\\/g, '/')

  // Build CSS links
  const cssLinks = mainCss.map((css) => `<link rel="stylesheet" href="${workbenchBase}/${css}">`).join('\n    ')

  // Build plugin assets
  const pluginCssLink = pluginResult?.cssPath
    ? `<link rel="stylesheet" href="${workbenchBase}/_plugins/plugins.css">`
    : ''

  const pluginScriptTag = pluginResult
    ? `<script type="module" src="${workbenchBase}/_plugins/plugins.js"></script>`
    : '<script>window.__MOTIA_PLUGINS__ = [];</script>'

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="${workbenchBase}/icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap" rel="stylesheet" />

    <script>
      const workbenchBase = ${JSON.stringify(workbenchBase)};
      const processCwd = "${processCwd}";
    </script>

    <script>
      function initAmplitude() {
        window.amplitude.init('ab2408031a38aa5cb85587a27ecfc69c', {
          autocapture: { fileDownloads: false, formInteractions: false },
          fetchRemoteConfig: true,
          recording: false,
          optOut: true,
        })
      }
    </script>
    <script src="https://cdn.amplitude.com/libs/analytics-browser-2.11.1-min.js.gz" onload="initAmplitude()"></script>

    ${
      process.env.MOTIA_ANALYTICS_DISABLED !== 'true'
        ? `<script type="text/javascript">
      !function(){var e,t,n;e="d8f0ce9cae8ae64",t=function(){Reo.init({clientID:"d8f0ce9cae8ae64", source: "internal"})},(n=document.createElement("script")).src="https://static.reo.dev/"+e+"/reo.js",n.defer=!0,n.onload=t,document.head.appendChild(n)}();
    </script>`
        : ''
    }

    ${cssLinks}
    ${pluginCssLink}

    <script>
      const importFile = async (path) => {
        console.warn('importFile is not available in production mode');
        if (path === 'tutorial/tutorial.tsx') return { steps: [] };
        throw new Error('Dynamic file imports not supported in production mode');
      }
    </script>

    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Motia Workbench</title>
  </head>
  <body class="dark">
    <div id="root"></div>
    ${pluginScriptTag}
    <script type="module" src="${workbenchBase}/${mainJs}"></script>
  </body>
</html>`

  // Serve static assets
  app.use(
    workbenchBase,
    express.static(clientDir, {
      index: false,
      maxAge: '1y',
      immutable: true,
    }),
  )

  // Serve plugin assets
  if (pluginResult) {
    app.use(`${workbenchBase}/_plugins`, express.static(pluginsOutputDir, { maxAge: 0 }))
  }

  // Serve public assets
  app.use(workbenchBase, express.static(path.join(__dirname, 'public'), { index: false }))

  // SPA fallback
  app.use(`${workbenchBase}/*`, (_req: Request, res: Response) => {
    res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
  })
}

/**
 * Main middleware that auto-detects production vs development mode.
 *
 * - Production: Uses pre-built assets + esbuild for plugins
 * - Development: Uses Vite for HMR and live compilation
 */
export const applyMiddleware = async (params: ApplyMiddlewareParams) => {
  // Force dev mode if __MOTIA_DEV_MODE__ is set (monorepo development)
  const forceDevMode = process.env.__MOTIA_DEV_MODE__ === 'true'

  if (forceDevMode || !hasPrebuiltAssets()) {
    await applyDevMiddleware(params)
  } else {
    await applyProdMiddleware(params)
  }
}
