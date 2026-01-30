import type { Root } from 'fumadocs-core/page-tree'
import { SidebarFolder } from './SidebarFolder'
import { SidebarItem } from './SidebarItem'

export const Sidebar: React.FC<{ tree: Root }> = ({ tree }) => {
  return (
    <div className="">
      {tree.children.map((child) =>
        child.type === 'page' ? (
          <SidebarItem key={child.$id} item={child} />
        ) : child.type === 'folder' ? (
          <SidebarFolder key={child.$id} item={child} />
        ) : null,
      )}
    </div>
  )
}
