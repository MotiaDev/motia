'use client'

import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock'

import { usePlausibleTracking } from '../../hooks/usePlausibleTracking'

export function PlausibleExample() {
  const { trackEvent, trackDownload, trackSignup, trackPurchase } = usePlausibleTracking()

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Plausible Analytics Examples</h3>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => trackEvent('Button Click', { position: 'hero', method: 'click' })}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Track Custom Event
        </button>

        <button
          onClick={() => trackDownload('motia-docs.pdf', 'button')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Track Download
        </button>

        <button
          onClick={() => trackSignup('newsletter')}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Track Signup
        </button>

        <button
          onClick={() => trackPurchase(29.99, 'USD', 'Motia Pro')}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Track Purchase
        </button>
      </div>

      <div className="text-sm text-gray-600">
        <p>These buttons demonstrate various Plausible event tracking capabilities:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>
            <strong>Custom Events:</strong> Track any user interaction with custom properties
          </li>
          <li>
            <strong>File Downloads:</strong> Automatically tracked due to file-downloads extension
          </li>
          <li>
            <strong>Outbound Links:</strong> External links tracked automatically
          </li>
          <li>
            <strong>Revenue Tracking:</strong> Track purchases with amount and currency
          </li>
          <li>
            <strong>Hash Navigation:</strong> Single-page app navigation tracking
          </li>
          <li>
            <strong>Pageview Props:</strong> Custom properties on page views
          </li>
        </ul>
      </div>
    </div>
  )
}

export function CodeDemo() {
  return <DynamicCodeBlock lang="ts" code='console.log("Hello World")' />
}
