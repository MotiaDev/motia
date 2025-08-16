import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Tabs, Tab } from 'fumadocs-ui/components/tabs'
import { ImageZoom } from 'fumadocs-ui/components/image-zoom'
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock'
import type { MDXComponents } from 'mdx/types';

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
    ...components,
  };
}
