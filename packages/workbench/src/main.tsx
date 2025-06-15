import { MotiaStreamProvider } from '@motiadev/stream-client-react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import { RootMotia } from './components/root-motia'
import './index.css'
import { RouteWrapper } from './route-wrapper'
import { Index } from './routes'
import { EndpointsPage } from './routes/endpoints-page'
import { Flow } from './routes/flow'
import { LogsPage } from './routes/logs-page'
import { StatesPage } from './routes/states-page'
import { TracesPage } from './routes/traces-page'

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  const address = window.location.origin.replace('http', 'ws')

  root.render(
    <StrictMode>
      <MotiaStreamProvider address={address}>
        <BrowserRouter>
          <RootMotia>
            <RouteWrapper>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/flow/:id" element={<Flow />} />
                <Route path="/logs" element={<LogsPage />} />
                <Route path="/states" element={<StatesPage />} />
                <Route path="/endpoints" element={<EndpointsPage />} />
                <Route path="/traces" element={<TracesPage />} />
              </Routes>
            </RouteWrapper>
          </RootMotia>
        </BrowserRouter>
      </MotiaStreamProvider>
    </StrictMode>,
  )
}
