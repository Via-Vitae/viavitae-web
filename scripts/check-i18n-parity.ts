import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// CI gate (pnpm check:i18n): messages/lt.json and messages/ru.json must have
// EXACTLY the same key structure as messages/en.json (the source of truth), with
// matching leaf types and no empty (untranslated) string values. pl/de are
// structural stubs for locales that are not routable yet (lib/routing.ts) and are
// intentionally out of scope. Run with: tsx scripts/check-i18n-parity.ts

const here = dirname(fileURLToPath(import.meta.url));
const messagesDir = resolve(here, "..", "messages");

type Json = unknown;

function typeOf(value: Json): string {
  return Array.isArray(value) ? "array" : typeof value;
}

/** Flatten a message bundle to leaf paths. Arrays are leaves; object elements inside arrays are expanded. */
function flatten(value: Json, prefix: string, out: Map<string, Json>): void {
  if (Array.isArray(value)) {
    out.set(prefix, value);
    value.forEach((element, index) => {
      if (element !== null && typeof element === "object")
        flatten(element, `${prefix}.${index}`, out);
    });
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, Json>)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, out);
    }
    return;
  }
  out.set(prefix, value);
}

function load(locale: string): Map<string, Json> {
  const raw = readFileSync(join(messagesDir, `${locale}.json`), "utf8");
  const out = new Map<string, Json>();
  flatten(JSON.parse(raw) as Json, "", out);
  return out;
}

const en = load("en");
const problems: string[] = [];

for (const locale of ["lt", "ru"] as const) {
  const other = load(locale);
  const missing = [...en.keys()].filter((key) => !other.has(key));
  const extra = [...other.keys()].filter((key) => !en.has(key));
  const typeMismatch = [...en.keys()].filter(
    (key) => other.has(key) && typeOf(other.get(key)) !== typeOf(en.get(key)),
  );
  const untranslated = [...other.entries()]
    .filter(([, value]) => typeof value === "string" && (value as string).trim() === "")
    .map(([key]) => key);

  for (const key of missing) problems.push(`${locale}: missing key "${key}"`);
  for (const key of extra) problems.push(`${locale}: extra key "${key}" (not in en)`);
  for (const key of typeMismatch) {
    problems.push(
      `${locale}: type mismatch for "${key}" (en=${typeOf(en.get(key))}, ${locale}=${typeOf(other.get(key))})`,
    );
  }
  for (const key of untranslated)
    problems.push(`${locale}: untranslated (empty) value for "${key}"`);

  if (!missing.length && !extra.length && !typeMismatch.length && !untranslated.length) {
    console.log(
      `OK ${locale}: ${other.size} keys in parity with en (${en.size} keys), no empty values`,
    );
  }
}

if (problems.length) {
  console.error(`\ni18n parity FAILED (${problems.length} problem(s)):`);
  for (const problem of problems) console.error("  - " + problem);
  process.exit(1);
}
console.log("\ni18n parity OK for lt/en/ru.");
