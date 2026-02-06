import { Mermaid } from "@/components/mdx/mermaid";
import { CodeBlock } from "@/components/mdx/code-block";
import { MultiLanguageCode } from "@/components/mdx/multi-language-code";
import type { MDXComponents } from "mdx/types";

export const mdxComponents: MDXComponents = {
  // Headings
  h1: ({ children }) => (
    <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl mb-6">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-10 mb-4">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-4 text-foreground">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3 text-foreground">
      {children}
    </h4>
  ),
  // Strong/bold text
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  // Paragraphs and text
  p: ({ children }) => (
    <p className="leading-7 [&:not(:first-child)]:mt-4 text-foreground [&>code]:text-foreground [&>strong]:text-foreground [&>strong]:font-semibold">
      {children}
    </p>
  ),
  // Lists
  ul: ({ children }) => (
    <ul className="my-4 ml-6 list-disc">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 ml-6 list-decimal">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="my-1">
      {children}
    </li>
  ),
  // Blockquote - used for callouts and example output
  blockquote: ({ children }) => (
    <blockquote className="mt-6 border-l-4 border-primary/60 pl-6 py-4 pr-4 rounded-r-lg bg-muted/30 dark:bg-muted/20 text-foreground [&>p]:text-foreground [&>h4]:mt-4 [&>h4:first-child]:mt-0 [&>ol]:my-2 [&>ul]:my-2">
      {children}
    </blockquote>
  ),
  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  // Code blocks - handled by rehype-pretty-code, but we wrap for additional styling
  pre: ({ children, ...props }) => <CodeBlock {...props}>{children}</CodeBlock>,
  code: ({ children, className, ...props }) => {
    // Check if this is an inline code or a code block
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="relative rounded bg-muted/80 dark:bg-muted/60 px-[0.3rem] py-[0.2rem] font-mono text-sm font-medium text-foreground dark:text-foreground border border-border/50 dark:border-border/30"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  // Tables
  table: ({ children }) => (
    <div className="my-6 w-full overflow-x-auto border border-border rounded-lg shadow-sm">
      <table className="w-full border-collapse bg-background">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted/80 dark:bg-muted/60 border-b border-border">
      {children}
    </thead>
  ),
  tbody: ({ children }) => <tbody className="divide-y divide-border/50">{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-border/30 transition-colors hover:bg-muted/40 dark:hover:bg-muted/30 even:bg-muted/10 dark:even:bg-muted/5">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="border-r border-border/30 last:border-r-0 px-4 py-3 text-left font-semibold text-sm text-foreground [&[align=center]]:text-center [&[align=right]]:text-right">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-r border-border/30 last:border-r-0 px-4 py-3 text-left text-sm text-foreground [&[align=center]]:text-center [&[align=right]]:text-right">
      {children}
    </td>
  ),
  // Horizontal rule
  hr: () => <hr className="my-8 border-border" />,
  // Custom Mermaid component
  Mermaid,
  // Multi-language code component
  MultiLanguageCode,
};
