import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { TOCItemType } from 'fumadocs-core/toc'
import { getModuleName, parseYamlWithComments, slugifyModuleName } from './config-parser'

const CONFIG_PATH = join(process.cwd(), 'content', 'how-to', 'iii-config.yaml')

export async function getConfigReferenceToc(): Promise<TOCItemType[]> {
  try {
    const yaml = await readFile(CONFIG_PATH, 'utf-8')
    const parsed = parseYamlWithComments(yaml)

    const hasRootConfig = parsed.some((n) => n.key !== 'modules')
    const modulesNode = parsed.find((n) => n.key === 'modules')
    const modules = modulesNode?.children || []

    const items: TOCItemType[] = [
      { title: 'Full Configuration Reference', url: '#full-configuration-reference', depth: 2 },
    ]

    if (hasRootConfig) {
      items.push({ title: 'Engine Settings', url: '#engine-settings', depth: 3 })
    }

    modules.forEach((m, i) => {
      const name = getModuleName(m)
      items.push({ title: name, url: `#module-${i}-${slugifyModuleName(name)}`, depth: 3 })
    })

    return items
  } catch {
    return []
  }
}
