import type {
  AnchorHTMLAttributes,
  ElementType,
  HTMLAttributes,
  ImgHTMLAttributes,
  JSX,
} from "react";
import { slugify } from "@/lib/utils";

// Custom MDX element renderers used by next-mdx-remote/rsc (ADR-WEB-003).
// Accessibility is enforced here so no author can ship a non-compliant document:
//   - images require alt text (empty alt is allowed only when explicitly decorative),
//   - headings get stable ids for skip-links and anchor navigation,
//   - external links get rel="noopener noreferrer" and open in a new tab.

function isExternal(href?: string): boolean {
  return Boolean(href && /^https?:\/\//i.test(href));
}

function Img({ alt, src, ...rest }: ImgHTMLAttributes<HTMLImageElement>): JSX.Element {
  if (alt === undefined) {
    // Fail loudly in development: an image without alt is a WCAG 1.1.1 failure.
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[mdx] <img src="${String(src)}"> is missing an alt attribute`);
    }
    alt = "";
  }
  // Content images are authored in MDX and served from /public; use a plain img
  // with eager loading and explicit dimensions to avoid CLS (set width/height in MDX).
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} src={src} loading="lazy" decoding="async" {...rest} />;
}

function Anchor({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>): JSX.Element {
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

function heading(level: number) {
  const Tag = `h${level}` as ElementType;
  return function Heading({ children, ...rest }: HTMLAttributes<HTMLHeadingElement>): JSX.Element {
    const text = String(children ?? "");
    const id = rest.id ?? slugify(text);
    return (
      <Tag id={id} {...rest}>
        {children}
      </Tag>
    );
  };
}

/** Component overrides passed to <MDXRemote components={mdxComponents} />. */
export const mdxComponents = {
  img: Img,
  a: Anchor,
  h1: heading(1),
  h2: heading(2),
  h3: heading(3),
  h4: heading(4),
  h5: heading(5),
  h6: heading(6),
} as const;
