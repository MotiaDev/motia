import { CodeWalkthrough } from './code-walkthrough'
import { useWalkthrough } from './hooks/use-walkthrough'

export const WalkthroughContainer: React.FC = () => {
  const { isOpen, config, code, language, close } = useWalkthrough()

  if (!isOpen || !config) {
    return null
  }

  return <CodeWalkthrough config={config} code={code} language={language} onClose={close} />
}
