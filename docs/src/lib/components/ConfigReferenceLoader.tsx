import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ConfigReference } from './ConfigReference'

interface ConfigReferenceLoaderProps {
  path?: string
}

export async function ConfigReferenceLoader({ path }: ConfigReferenceLoaderProps) {
  const configPath = path || join(process.cwd(), 'content', 'how-to', 'iii-config.yaml')

  try {
    const yaml = await readFile(configPath, 'utf-8')
    return <ConfigReference yaml={yaml} />
  } catch (error) {
    console.error('Failed to load config file:', error)
    return (
      <div className="p-4 border border-red-500 rounded-lg bg-red-500/10">
        <p className="text-red-500">
          Failed to load configuration file. Make sure{' '}
          <code className="text-sm">iii-config.yaml</code> exists in the docs/content/how-to
          directory.
        </p>
      </div>
    )
  }
}
