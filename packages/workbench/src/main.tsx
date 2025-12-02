import { MotiaStreamProvider } from '@motiadev/stream-client-react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { App } from './App'
import { NotFoundPage } from './components/NotFoundPage'
import { RootMotia } from './components/root-motia'
import './index.css'

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const basePath = workbenchBase
  const root = createRoot(rootElement)
  const address = window.location.origin.replace('http', 'ws')

  root.render(
    <StrictMode>
      <MotiaStreamProvider address={address}>
        <RootMotia>
          <BrowserRouter>
            <Routes>
              <Route path={basePath} element={<App />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </RootMotia>
      </MotiaStreamProvider>
    </StrictMode>,
  )
}
