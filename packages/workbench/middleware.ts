import type { Express, NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { createServer as createViteServer } from 'vite'
import react from '@vitejs/plugin-react'

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

export const applyMiddleware = async (app: Express) => {
  const vite = await createViteServer({
    appType: 'spa',
    root: __dirname,

    server: {
      middlewareMode: true,
      allowedHosts: true,
      host: true,
      fs: {
        allow: [
          __dirname, // workbench root
          path.join(process.cwd(), './steps'), // steps directory
          path.join(process.cwd(), './tutorial.tsx'), // tutorial file
        ],
      },
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    plugins: [react(), processCwdPlugin()],
  })

  app.use(vite.middlewares)

  app.use('*', async (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl

    console.log('[UI] Request', { url })

    try {
      const index = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')
      const html = await vite.transformIndexHtml(url, index)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      next(e)
    }
  })
}
