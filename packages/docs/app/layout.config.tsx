import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import Image from 'next/image'
import DiscordIcon from '../components/DiscordIcon'
import GitHubIcon from '../components/GitHubIcon'
import GitHubStarButton from '../components/GitHubStarButton'
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
        <Image src="/logos/logo-black.png" alt="Motia Icon" className="dark:hidden" width={100} height={30} />
        <Image src="/logos/logo-white.png" alt="Motia Icon" className="hidden dark:block" width={100} height={30} />
      </div>
    ),
  },
}
