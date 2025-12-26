import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import { Card } from '@/lib/components/Card'
import { Columns } from './lib/components/Columns'
import { AccordionGroup, Accordion } from './lib/components/Accordion'
import { Tip } from './lib/components/Tip'
import { Expandable } from './lib/components/Expandable'
import { ResponseField } from './lib/components/ResponseField'
import { Warning } from './lib/components/Warning'
import { Image } from './lib/components/Image'

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...components,
    Card: Card,
    Columns: Columns,
    AccordionGroup: AccordionGroup,
    Accordion: Accordion,
    Expandable: Expandable,
    Tip: Tip,
    ResponseField: ResponseField,
    Warning: Warning,
    Image: Image,
  }
}
