import { source } from "@/lib/source";

export const revalidate = false;

export async function GET() {
  const pages = source.getPages();
  const lines = [
    "# iii Documentation",
    "",
    "> iii (Interoperable Invocation Interface) - Three primitives engine",
    "",
    "## Docs",
    "",
    ...pages.map((page) => `- [${page.data.title}](${page.url}.mdx)`),
  ];
  return new Response(lines.join("\n"));
}
