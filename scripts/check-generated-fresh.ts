import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// CI gate (pnpm check:generated, ADR-WEB-005): regenerate the contract types into a
// temp dir and diff against the COMMITTED src/generated/*.ts. Any difference means
// someone edited a spec without regenerating, or hand-edited a generated file.
//
// BOOTSTRAP NOTE: src/generated/*.ts are committed artefacts. On a fresh scaffold
// they do not exist yet; this gate then fails with an explicit instruction to run
// `pnpm generate:types` and commit — the same first-run bootstrap as pnpm-lock.yaml.

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const bin = join(root, "node_modules", ".bin", "openapi-typescript");

const CONTRACTS = [
  { spec: "docs/contracts/assessment.openapi.yaml", out: "src/generated/assessment.ts" },
  { spec: "docs/contracts/quotes.openapi.yaml", out: "src/generated/quotes.ts" },
];

if (!existsSync(bin)) {
  console.error("openapi-typescript is not installed. Run `pnpm install` first.");
  process.exit(1);
}

const tmp = mkdtempSync(join(tmpdir(), "vv-generated-"));
const problems: string[] = [];

try {
  for (const { spec, out } of CONTRACTS) {
    const tmpOut = join(tmp, out.replace(/[\\/]/g, "_"));
    try {
      execFileSync(bin, [join(root, spec), "-o", tmpOut], { cwd: root, stdio: "pipe" });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      problems.push(`could not generate types from ${spec}: ${detail}`);
      continue;
    }

    const fresh = readFileSync(tmpOut, "utf8");
    const committedPath = join(root, out);
    if (!existsSync(committedPath)) {
      problems.push(
        `${out} is not committed. Run \`pnpm generate:types\` and commit the output (ADR-WEB-005).`,
      );
      continue;
    }
    if (readFileSync(committedPath, "utf8") !== fresh) {
      problems.push(
        `${out} is stale (spec changed without regenerating, or the file was hand-edited). Run \`pnpm generate:types\` and commit.`,
      );
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (problems.length) {
  console.error("Generated-types freshness check FAILED (ADR-WEB-005):");
  for (const problem of problems) console.error("  - " + problem);
  process.exit(1);
}
console.log("Generated contract types are fresh and committed.");
