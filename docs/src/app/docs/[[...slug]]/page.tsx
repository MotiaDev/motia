import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleActions } from "@/lib/components/ArticleActions";
import { SectionCards } from "@/lib/components/SectionCards";
import { getLLMText, getPageImage, source } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";

function isIndexPage(slugs: string[] | undefined): boolean {
  if (!slugs || slugs.length === 0) return false;
  const tree = source.pageTree;
  return hasMatchingFolderIndex(tree.children, `/docs/${slugs.join("/")}`);
}

function hasMatchingFolderIndex(
  nodes: typeof source.pageTree.children,
  targetUrl: string,
): boolean {
  for (const node of nodes) {
    if (node.type === "folder") {
      if (node.index?.url === targetUrl) return true;
      if (hasMatchingFolderIndex(node.children, targetUrl)) return true;
    }
  }
  return false;
}

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdown = await getLLMText(page);
  const isIndex = isIndexPage(params.slug);

  const isRootIndex = !params.slug || params.slug.length === 0;

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{ style: "clerk" }}
      footer={
        isRootIndex
          ? {
              items: {
                next: { name: "Quickstart", url: "/docs/tutorials/quickstart" },
              },
            }
          : { enabled: !isIndex }
      }
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <ArticleActions markdown={markdown} title={page.data.title} />
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
        {isIndex && params.slug && (
          <SectionCards tree={source.pageTree} slugs={params.slug} />
        )}
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
