import defaultMdxComponents from 'fumadocs-ui/mdx'
import {
  Activity,
  ArrowBigDownDash,
  Blocks,
  BookOpen,
  Clock,
  Code,
  Cog,
  FileText,
  Filter,
  Globe,
  Handshake,
  LayoutTemplate,
  Parentheses,
  Recycle,
  Rocket,
  Search,
  Settings,
  Terminal,
  Zap,
} from 'lucide-react'
import type { MDXComponents } from 'mdx/types'
import { Card } from '@/lib/components/Card'
import { Accordion, AccordionGroup } from './lib/components/Accordion'
import { Columns } from './lib/components/Columns'
import { ConfigReference } from './lib/components/ConfigReference'
import { ConfigReferenceLoader } from './lib/components/ConfigReferenceLoader'
import { Expandable } from './lib/components/Expandable'
import { Image } from './lib/components/Image'
import { TabsConditional } from './lib/components/TabsConditional'
import { Mermaid } from './lib/components/Mermaid'
import { ResponseField } from './lib/components/ResponseField'
import { Tip } from './lib/components/Tip'
import { Warning } from './lib/components/Warning'
import * as TabsComponents from './lib/components/Tabs'

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    ...components,
    Card,
    Columns,
    ConfigReference,
    ConfigReferenceLoader,
    AccordionGroup,
    Accordion,
    Expandable,
    Tip,
    ResponseField,
    Warning,
    Image,
    TabsConditional,
    Mermaid,
    Globe,
    Activity,
    Filter,
    Zap,
    Clock,
    FileText,
    Terminal,
    Blocks,
    Settings,
    Code,
    ArrowBigDownDash,
    Recycle,
    Parentheses,
    Rocket,
    Search,
    BookOpen,
    Cog,
    Handshake,
    LayoutTemplate,
  }
}
