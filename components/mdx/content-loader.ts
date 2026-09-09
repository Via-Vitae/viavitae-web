import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import type { Locale } from "@/lib/routing";
import { routing } from "@/lib/routing";
import type { ContentDoc } from "@/types/content";

// Locale-aware MDX reader with a fallback chain (ADR-WEB-003).
// Resolution for locale L: content/<collection>/L/<slug>.mdx -> content/<collection>/en/<slug>.mdx
// -> not found. LEGAL is the exception: it never falls back, because a legal text in
// the wrong language/jurisdiction is worse than none (launch gate).

export type Collection = "blog" | "news" | "guides" | "legal";

const baseFrontMatter = {
  title: z.string().min(1),
  description: z.string().min(1),
  locale: z.enum(routing.locales as unknown as [Locale, ...Locale[]]),
  slug: z.string().min(1),
  draft: z.boolean().optional(),
};

const schemas: Record<Collection, z.ZodTypeAny> = {
  blog: z.object({
    ...baseFrontMatter,
    kind: z.literal("blog"),
    publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    updatedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    author: z.string().min(1),
    category: z.string().min(1),
    tags: z.array(z.string()).optional(),
    image: z.string().optional(),
  }),
  news: z.object({
    ...baseFrontMatter,
    kind: z.literal("news"),
    publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    source: z.string().optional(),
  }),
  guides: z.object({
    ...baseFrontMatter,
    kind: z.literal("guide"),
    topic: z.string().min(1),
    readingMinutes: z.number().int().positive().optional(),
    updatedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  }),
  legal: z.object({
    ...baseFrontMatter,
    kind: z.literal("legal"),
    doc: z.enum(["privacy", "terms", "cookies", "impressum"]),
    effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    version: z.string().min(1),
  }),
};

const contentRoot = path.join(process.cwd(), "content");

function fileFor(collection: Collection, locale: Locale, slug: string): string {
  return path.join(contentRoot, collection, locale, `${slug}.mdx`);
}

async function readIfExists(file: string): Promise<{ data: unknown; content: string } | null> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = matter(raw);
    return { data: parsed.data, content: parsed.content };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

/**
 * Load a single document. Returns null when no localised (or fallback) file
 * exists. Throws on invalid front-matter so a malformed document fails loudly
 * rather than rendering half a page.
 */
export async function getDoc<F extends ContentDoc["frontMatter"]>(
  collection: Collection,
  locale: Locale,
  slug: string,
): Promise<ContentDoc<F> | null> {
  const chain: Locale[] = collection === "legal" ? [locale] : [locale, "en"];
  const seen = new Set<Locale>();

  for (const candidate of chain) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    const file = fileFor(collection, candidate, slug);
    const raw = await readIfExists(file);
    if (!raw) continue;

    const result = schemas[collection].safeParse(raw.data);
    if (!result.success) {
      throw new Error(
        `Invalid ${collection} front-matter in ${file}: ${result.error.issues
          .map((issue) => `${issue.path.join(".") || "(root)"} ${issue.message}`)
          .join("; ")}`,
      );
    }
    return { frontMatter: result.data as F, body: raw.content };
  }
  return null;
}

/** List published (non-draft) slugs for a collection in a locale, newest-first where dated. */
export async function listSlugs(collection: Collection, locale: Locale): Promise<string[]> {
  const dir = path.join(contentRoot, collection, locale);
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  return entries
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => name.replace(/\.mdx$/, ""))
    .sort();
}
