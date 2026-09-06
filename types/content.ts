// MDX content front-matter contracts (ADR-WEB-003).
// Every MDX document under content/** declares front-matter matching one of these
// shapes. content-loader.ts validates front-matter against these types at read time.

import type { Locale } from '@/lib/routing';

/** Fields shared by every MDX document. */
interface BaseFrontMatter {
  /** Document title (plain string; localisation lives in the per-locale file). */
  readonly title: string;
  /** Short description used for meta + cards. */
  readonly description: string;
  /** Locale this document is written in. Mirrors the directory it lives under. */
  readonly locale: Locale;
  /** Canonical slug (no locale prefix). */
  readonly slug: string;
  /** Whether search engines may index this document. */
  readonly draft?: boolean;
}

export interface BlogFrontMatter extends BaseFrontMatter {
  readonly kind: 'blog';
  /** ISO-8601 publication date (YYYY-MM-DD). */
  readonly publishedAt: string;
  /** ISO-8601 last-modified date (YYYY-MM-DD). */
  readonly updatedAt?: string;
  readonly author: string;
  readonly category: string;
  readonly tags?: readonly string[];
  /** Hero image path under public/images (launch-gated asset). */
  readonly image?: string;
}

export interface NewsFrontMatter extends BaseFrontMatter {
  readonly kind: 'news';
  readonly publishedAt: string;
  readonly source?: string;
}

export interface GuideFrontMatter extends BaseFrontMatter {
  readonly kind: 'guide';
  readonly topic: string;
  /** Estimated reading time in minutes; drives the card label. */
  readonly readingMinutes?: number;
  readonly updatedAt?: string;
}

export interface LegalFrontMatter extends BaseFrontMatter {
  readonly kind: 'legal';
  readonly doc: 'privacy' | 'terms' | 'cookies' | 'impressum';
  /** ISO-8601 date this legal text takes effect. */
  readonly effectiveDate: string;
  /** Legal document version, surfaced in the page footer. */
  readonly version: string;
}

export type ContentFrontMatter =
  | BlogFrontMatter
  | NewsFrontMatter
  | GuideFrontMatter
  | LegalFrontMatter;

/** A loaded MDX document: validated front-matter plus the raw MDX body. */
export interface ContentDoc<F extends ContentFrontMatter = ContentFrontMatter> {
  readonly frontMatter: F;
  /** Raw MDX source, compiled at render time by next-mdx-remote/rsc. */
  readonly body: string;
}
