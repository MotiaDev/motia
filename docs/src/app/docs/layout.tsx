import { SidebarItem } from '@/lib/components/SidebarItem'
import { baseOptions } from '@/lib/layout.shared'
import { source } from '@/lib/source'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { SidebarFolder } from '@/lib/components/SidebarFolder'

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...baseOptions()}
      sidebar={{
        collapsible: false,
        // TODO: implement sidebar component
        // component: <Sidebar tree={source.pageTree} />,
        components: {
          Item: SidebarItem,
          Folder: SidebarFolder,
        },
      }}
    >
      {children}
    </DocsLayout>
  )
}
