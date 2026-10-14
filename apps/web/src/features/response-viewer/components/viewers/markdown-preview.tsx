"use client";

import { useTranslations } from "next-intl";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import type { ResponseViewerProps } from "../../lib/response-viewers";

/** Images embedded in the Markdown itself; remote ones are links, like in the HTML preview. */
const EMBEDDED_IMAGE_PREFIX = "data:image/";

/** A remote image as a link: showing it would contact another server on the user's behalf. */
function MarkdownImage({ src, alt }: { src?: string | Blob; alt?: string }) {
  const t = useTranslations("responseViewer.preview");
  if (typeof src !== "string" || src === "") return null;
  if (src.startsWith(EMBEDDED_IMAGE_PREFIX)) {
    // eslint-disable-next-line @next/next/no-img-element -- An image embedded in the body: nothing to optimize or fetch.
    return <img src={src} alt={alt ?? ""} className="inline max-w-full rounded-sm" />;
  }
  return (
    <a href={src} target="_blank" rel="noopener noreferrer" className="text-primary underline">
      {t("remoteImage", { name: alt === undefined || alt === "" ? src : alt })}
    </a>
  );
}

/** Markdown elements in the app's type scale and tokens (design-system.md#typography). */
const MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => <h1 className="mt-6 mb-3 text-2xl font-semibold first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-6 mb-3 text-xl font-semibold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-5 mb-2 text-lg font-semibold first:mt-0">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-4 mb-2 font-semibold first:mt-0">{children}</h4>,
  h5: ({ children }) => <h5 className="mt-4 mb-2 font-semibold first:mt-0">{children}</h5>,
  h6: ({ children }) => (
    <h6 className="mt-4 mb-2 font-semibold text-muted-foreground first:mt-0">{children}</h6>
  ),
  p: ({ children }) => <p className="my-3 leading-relaxed first:mt-0">{children}</p>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1 ps-6">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 ps-6">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-s-2 border-border-strong ps-4 text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded-sm bg-surface-hover px-1 font-mono text-[0.9em]">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-md border bg-surface p-3 font-mono text-xs [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-6 border-border" />,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border bg-surface px-2 py-1 text-start font-medium">{children}</th>
  ),
  td: ({ children }) => <td className="border px-2 py-1 align-top">{children}</td>,
  img: ({ src, alt }) => <MarkdownImage src={src} alt={alt} />,
};

/**
 * The Markdown preview (F-14), GitHub-flavoured. It renders React elements, never raw HTML (HTML
 * in the Markdown shows as text), drops unsafe link protocols, and loads no remote images.
 */
export function MarkdownPreview({ response }: ResponseViewerProps) {
  const t = useTranslations("responseViewer.preview");
  return (
    <article
      aria-label={t("markdownLabel")}
      className="h-full overflow-auto p-4 text-sm break-words text-foreground"
    >
      <Markdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
        {response.body.data}
      </Markdown>
    </article>
  );
}
