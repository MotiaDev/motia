import react from '@vitejs/plugin-react'
import type { Express, NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { createServer as createViteServer } from 'vite'
import motiaPluginsPlugin, { type WorkbenchPlugin } from './vite-plugin-motia-plugins'

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

export const applyMiddleware = async ({ app, port, workbenchBase, plugins }: ApplyMiddlewareParams) => {
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
          path.join(process.cwd(), './tutorial.tsx'), // tutorial file
          path.join(process.cwd(), './node_modules'), // node_modules directory
        ],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/assets': path.resolve(__dirname, './src/assets'),
        // antd: path.join(process.cwd(), './node_modules/antd'),
      },
    },
    plugins: [react(), processCwdPlugin(), reoPlugin(), motiaPluginsPlugin(plugins)],
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
