import { MotiaStreamProvider } from '@motiadev/stream-client-react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RootMotia } from './components/root-motia'
import '@motiadev/ui/globals.css'
import './index.css'
import { App } from './App'

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  const address = window.location.origin.replace('http', 'ws')

  root.render(
    <StrictMode>
      <MotiaStreamProvider address={address}>
        <RootMotia>
          <App />
        </RootMotia>
      </MotiaStreamProvider>
    </StrictMode>,
  )
}
