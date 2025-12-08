import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@motiadev/ui'
import { Rocket } from 'lucide-react'
import { useState } from 'react'
import { motiaAnalytics } from '../../lib/motia-analytics'

export const DeployButton = () => {
  const [isOpen, setIsOpen] = useState(false)

  const onDeployButtonClick = () => {
    motiaAnalytics.track('deploy_button_clicked')
  }

  const onDeployClick = () => {
    setIsOpen(false)
    motiaAnalytics.track('deploy_button_deploy_clicked')
  }

  const onClose = () => {
    setIsOpen(false)
    motiaAnalytics.track('deploy_button_closed')
  }

  const onMotiaCloudClick = () => {
    setIsOpen(true)
    motiaAnalytics.track('deploy_button_motia_cloud_clicked')
  }

  const onSelfHostedClick = () => {
    motiaAnalytics.track('deploy_button_self_hosted_clicked')
    window.open('https://www.motia.dev/docs/deployment-guide/self-hosted', '_blank')
  }

  return (
    <>
      {isOpen && (
        <div>
          {/* backdrop container */}
          <div className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div className="driver-popover w-[600px]! fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] animate-in fade-in-0 zoom-in-95">
            <img
              src="https://oxhhfuuoqzsaqthfairn.supabase.co/storage/v1/object/public/public-images/preview.png"
              alt="Motia Cloud"
              className="driver-popover-image object-cover"
              style={{ height: 393, width: '100%' }}
            />

            <div className="driver-popover-title">
              <h2 className="popover-title">Motia Cloud is Live!</h2>
            </div>

            <div className="driver-popover-description">
              Deploy to production in minutes, not hours. One click gets your Motia project live with enterprise-grade
              reliability. Seamlessly scale, rollback instantly, and monitor everything in real-time. Your code deserves
              infrastructure that just works.
            </div>

            <a
              href="https://www.motia.dev/docs/deployment-guide/motia-cloud/features"
              target="_blank"
              className="text-foreground text-xs font-semibold px-4 hover:underline"
              rel="noopener"
            >
              Learn more about Motia Cloud
            </a>

            <div className="driver-popover-footer flex items-center justify-end">
              <div className="driver-popover-navigation-btns flex gap-6">
                <button
                  className="tutorial-opt-out-button text-sm! font-semibold! text-muted-foreground!"
                  onClick={onClose}
                >
                  Close
                </button>
                <a
                  href="https://motia.cloud?utm_source=workbench&utm_medium=referral"
                  target="_blank"
                  onClick={onDeployClick}
                  rel="noopener"
                >
                  <button className="driver-popover-next-btn">Deploy!</button>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="font-semibold text-sm dark:bg-white dark:text-black dark:hover:bg-white/90 bg-black/90 hover:bg-black/80 text-white"
            onClick={onDeployButtonClick}
          >
            <Rocket />
            Deploy
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-background text-foreground w-56">
          <DropdownMenuItem className="cursor-pointer h-10 font-semibold" onClick={onMotiaCloudClick}>
            Motia Cloud
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer h-10 font-semibold" onClick={onSelfHostedClick}>
            Self-Hosted (Docker)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
