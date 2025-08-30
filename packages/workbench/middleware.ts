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

      // Add Reo analytics script
      const reoScript = `
<script>
!function(){var e,t,n;e="d8f0ce9cae8ae64",t=function(){Reo.init({clientID:"d8f0ce9cae8ae64", source: "internal"})},
(n=document.createElement("script")).src="https://static.reo.dev/"+e+"/reo.js",n.defer=!0,n.onload=t,document.head.appendChild(n)}();
</script>`
      return html.replace('</head>', `<script>const processCwd = "${cwd}";</script>${reoScript}</head>`)
    },
  }
}

export const applyMiddleware = async (app: Express, port: number) => {
  const vite = await createViteServer({
    appType: 'spa',
    root: __dirname,

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
