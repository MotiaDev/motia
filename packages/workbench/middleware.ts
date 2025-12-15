import { Printer } from '@motiadev/core'
import react from '@vitejs/plugin-react'
import type { Express, NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { ViteDevServer } from 'vite'
import { createServer as createViteServer } from 'vite'
import motiaPluginsPlugin from './motia-plugin/index.js'
import type { WorkbenchPlugin } from './motia-plugin/types.js'
import { CONSTANTS } from './motia-plugin/types.js'

const workbenchBasePlugin = (workbenchBase: string) => {
  return {
    name: 'html-transform',
    transformIndexHtml: (html: string) => {
      return html.replace('</head>', `<script>const workbenchBase = ${JSON.stringify(workbenchBase)};</script></head>`)
    },
  }
}

const processCwdPlugin = () => {
  return {
    name: 'html-transform',
    transformIndexHtml: (html: string) => {
      // Normalize path for cross-platform compatibility
      const cwd = process.cwd().replace(/\\/g, '/')
      return html.replace('</head>', `<script>const processCwd = "${cwd}";</script></head>`)
    },
  }
}

const reoPlugin = () => {
  return {
    name: 'html-transform',
    transformIndexHtml(html: string) {
      const isAnalyticsEnabled = process.env.MOTIA_ANALYTICS_DISABLED !== 'true'

      if (!isAnalyticsEnabled) {
        return html
      }

      // inject before </head>
      return html.replace(
        '</head>',
        `
        <script type="text/javascript">
          !function(){var e,t,n;e="d8f0ce9cae8ae64",t=function(){Reo.init({clientID:"d8f0ce9cae8ae64", source: "internal"})},(n=document.createElement("script")).src="https://static.reo.dev/"+e+"/reo.js",n.defer=!0,n.onload=t,document.head.appendChild(n)}();
        </script>
    </head>`,
      )
    },
  }
}

export type ApplyMiddlewareParams = {
  app: Express
  port: number
  workbenchBase: string
  plugins: WorkbenchPlugin[]
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const warmupMotiaPlugins = async (viteServer: ViteDevServer) => {
  try {
    const result = await viteServer.transformRequest(CONSTANTS.VIRTUAL_MODULE_ID)

    if (result?.code) {
      printer.printPluginLog('Plugin system warmed up eagerly')
    } else {
      printer.printPluginWarn('Plugin warm-up returned empty result')
    }
  } catch (error) {
    printer.printPluginWarn(`Failed to warm up plugin system, continuing lazily: ${error}`)
  }
}

const printer = new Printer(process.cwd())

export const applyMiddleware = async ({ app, port, workbenchBase, plugins }: ApplyMiddlewareParams): Promise<void> => {
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
          __dirname, // workbench root
          path.join(process.cwd(), './steps'), // steps directory
          path.join(process.cwd(), './src'), // src directory
          path.join(process.cwd(), './tutorial'), // tutorial directory
          path.join(process.cwd(), './node_modules'), // node_modules directory
          path.join(__dirname, './node_modules'), // node_modules directory
        ],
      },
    },
    resolve: {
      dedupe: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@motiadev/stream-client-react',
        '@motiadev/stream-client-browser',
        '@motiadev/stream-client',
      ],
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/assets': path.resolve(__dirname, './src/assets'),
        'lucide-react/dynamic': 'lucide-react/dynamic.mjs',
        'lucide-react': 'lucide-react/dist/cjs/lucide-react.js',
      },
    },
    optimizeDeps: {
      exclude: ['@motiadev/workbench'],
    },
    plugins: [
      react({
        babel: {
          plugins: ['babel-plugin-react-compiler'],
        },
      }),
      processCwdPlugin(),
      reoPlugin(),
      motiaPluginsPlugin(plugins),
      workbenchBasePlugin(workbenchBase),
    ],
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.ico', '**/*.webp', '**/*.avif'],
  })

  await warmupMotiaPlugins(vite)

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
