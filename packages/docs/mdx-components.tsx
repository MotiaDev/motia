import * as Twoslash from 'fumadocs-twoslash/ui'
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock'
import { ImageZoom } from 'fumadocs-ui/components/image-zoom'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import { Mermaid } from '@/components/Mermaid'

// use this function to get MDX components, you will need it for rendering MDX
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    // Enable zoom on all images
    img: (props) => <ImageZoom {...(props as any)} />,
    // Render all fenced code blocks with Fumadocs CodeBlock UI
    pre: ({ ref: _ref, ...props }) => (
      <CodeBlock {...props}>
        <Pre>{props.children}</Pre>
      </CodeBlock>
    ),
    // Expose Tabs components directly in MDX
    Tabs,
    Tab,
    // Enable Mermaid diagrams
    Mermaid,
    // Enable Twoslash components
    ...Twoslash,
    ...components,
  }
}
