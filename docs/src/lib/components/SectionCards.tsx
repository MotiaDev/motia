import type { Folder, Item, Node, Root } from 'fumadocs-core/page-tree'
import { Cards } from 'fumadocs-ui/components/card'
import { Card } from './Card'

type Props = {
  tree: Root
  slugs: string[]
}

function findFolder(nodes: Node[], slugs: string[]): Folder | null {
  const targetUrl = `/docs/${slugs.join('/')}`
  for (const node of nodes) {
    if (node.type === 'folder') {
      if (node.index?.url === targetUrl) return node
      const found = findFolder(node.children, slugs)
      if (found) return found
    }
  }
  return null
}

export function SectionCards({ tree, slugs }: Props) {
  const folder = findFolder(tree.children, slugs)
  if (!folder) return null

  // Get page children (not nested folders)
  const pages = folder.children.filter((child): child is Item => child.type === 'page')

  if (pages.length === 0) return null

  return (
    <Cards>
      {pages.map((page) => (
        <Card
          key={page.url}
          title={String(page.name)}
          description={page.description ? String(page.description) : undefined}
          href={page.url}
        />
      ))}
    </Cards>
  )
}
