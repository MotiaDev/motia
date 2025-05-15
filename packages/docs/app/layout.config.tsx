import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import GitHubStarButton from '../components/GitHubStarButton'
import GitHubIcon from '../components/GitHubIcon'
import DiscordIcon from '../components/DiscordIcon'

import Image from 'next/image'
/**
 * Shared layout configurations
 *
 * you can configure layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    transparentMode: 'none',
    title: (
      <div className="inline-flex items-center gap-1">
        <Image src="/logos/logo-black.svg" alt="Motia Icon" className="dark:hidden" width={100} height={30} />
        <Image src="/logos/logo-white.svg" alt="Motia Icon" className="hidden dark:block" width={100} height={30} />
      </div>
    ),
  },
}
