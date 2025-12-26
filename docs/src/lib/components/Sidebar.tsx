import { Root } from 'fumadocs-core/page-tree'
import { SidebarItem } from './SidebarItem'
import { SidebarFolder } from './SidebarFolder'

export const Sidebar: React.FC<{ tree: Root }> = ({ tree }) => {
  return (
    <div className="">
      {tree.children.map((child) => (child.type === 'page' ? <SidebarItem key={child.$id} item={child} /> : null))}
      {tree.children.map((child) => (child.type === 'folder' ? <SidebarFolder key={child.$id} item={child} /> : null))}
    </div>
  )
}
