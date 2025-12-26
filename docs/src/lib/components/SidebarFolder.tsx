'use client'
import { Folder } from 'fumadocs-core/page-tree'
import { PropsWithChildren } from 'react'
import { SidebarItem } from './SidebarItem'

export const SidebarFolder: React.FC<PropsWithChildren<{ item: Folder }>> = ({ item, children }) => {
  return (
    <div className="w-full flex flex-col items-start mt-6">
      <div className="text-sm font-medium px-2">{item.name}</div>
      <div className="w-full flex flex-col items-start py-2">
        {item.children.map((child) => (child.type === 'page' ? <SidebarItem key={child.$id} item={child} /> : null))}
      </div>
    </div>
  )
}
