import { source } from '@/lib/source'
import { DocsPage, DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createRelativeLink } from 'fumadocs-ui/mdx'
import { getMDXComponents } from '@/mdx-components'
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock'
import { Callout } from 'fumadocs-ui/components/callout'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import { Banner } from 'fumadocs-ui/components/banner'
import { DescriptionTable } from '@/components/DescriptionTable'
import { LLMCopyButton, ViewOptions } from '@/components/ai/page-actions'
import { Step, Steps } from 'fumadocs-ui/components/steps'
import { ImageZoom, ImageZoomProps } from 'fumadocs-ui/components/image-zoom'
import { TypeTable } from 'fumadocs-ui/components/type-table'
import { Card, Cards } from 'fumadocs-ui/components/card'
import { File, Folder, Files } from 'fumadocs-ui/components/files'
import { Breadcrumb } from '@/components/Breadcrumb'
import { CodeSandbox } from '@/components/CodeSandbox'
import { TrelloTab } from '@/components/TrelloCodeFetcher'
import { GitHubWorkflowTab } from '@/components/GitHubIntegrationCodeFetcher'

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDXContent = page.data.body
  const slugSegments = params.slug ?? []
  const docPath = slugSegments.length ? slugSegments.join('/') : 'index'

  return (
    <DocsPage 
      toc={page.data.toc} 
      full={page.data.full}
      tableOfContent={{
        style: 'clerk'
      }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-2">{page.data.description}</DocsDescription>
      <div className="mt-0 flex items-center gap-2">
        <LLMCopyButton markdownUrl={`/docs/${docPath}.mdx`} />
        <ViewOptions
          markdownUrl={`/docs/${docPath}.mdx`}
          githubUrl={`https://github.com/MotiaDev/motia/blob/main/packages/docs/content/docs/${docPath}.mdx`}
        />
      </div>
      <DocsBody>
        <MDXContent
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
             
            pre: ({ ref: _ref, ...props }) => (
              <CodeBlock {...props}>
                <Pre>{props.children}</Pre>
              </CodeBlock>
            ),
            Card,
            Cards,
            Callout,
            File,
            Folder,
            Files,
            Tab,
            Tabs,
            DescriptionTable,
            Breadcrumb,
            Step,
            Steps,
            TypeTable,
            img: (props) => <ImageZoom {...(props as ImageZoomProps)} />,
            CodeSandbox,
            TrelloTab,
            GitHubWorkflowTab,
            a: createRelativeLink(source, page),
          })}
        />
        <Banner>
          Need help? See our&nbsp;
          <Link href="/docs/community-resources" aria-label="Visit Community">
            Community Resources
          </Link>
          &nbsp;for questions, examples, and discussions.
        </Banner>
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
  }
}
