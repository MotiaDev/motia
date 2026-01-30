import defaultMdxComponents from "fumadocs-ui/mdx";
import {
  Activity,
  ArrowBigDownDash,
  Blocks,
  Clock,
  Code,
  Cog,
  FileText,
  Globe,
  Handshake,
  Parentheses,
  Recycle,
  Rocket,
  Settings,
  Terminal,
  Zap,
} from "lucide-react";
import type { MDXComponents } from "mdx/types";
import { Card } from "@/lib/components/Card";
import { Accordion, AccordionGroup } from "./lib/components/Accordion";
import { Columns } from "./lib/components/Columns";
import { Expandable } from "./lib/components/Expandable";
import { Image } from "./lib/components/Image";
import { Mermaid } from "./lib/components/Mermaid";
import { ResponseField } from "./lib/components/ResponseField";
import { Tip } from "./lib/components/Tip";
import { Warning } from "./lib/components/Warning";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...components,
    Card,
    Columns,
    AccordionGroup,
    Accordion,
    Expandable,
    Tip,
    ResponseField,
    Warning,
    Image,
    Mermaid,
    Globe,
    Activity,
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
    Cog,
    Handshake,
  };
}
