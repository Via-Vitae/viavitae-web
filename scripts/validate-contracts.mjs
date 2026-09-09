// CI gate: the OpenAPI contracts must parse and satisfy the repo's invariants
// (ADR-WEB-005). Uses the `yaml` devDependency. Fails the contract-check job on
// a parse error or a structural violation, before any types are generated.
import { readFileSync } from "node:fs";
import { parse } from "yaml";

const CONTRACTS = [
  {
    file: "docs/contracts/assessment.openapi.yaml",
    path: "/assessment",
    operationId: "submitAssessment",
  },
  { file: "docs/contracts/quotes.openapi.yaml", path: "/quotes", operationId: "createQuote" },
];

const errors = [];

for (const { file, path, operationId } of CONTRACTS) {
  let doc;
  try {
    doc = parse(readFileSync(file, "utf8"));
  } catch (err) {
    errors.push(`${file}: YAML parse error — ${err.message}`);
    continue;
  }

  if (!doc || typeof doc !== "object") {
    errors.push(`${file}: empty or non-mapping document`);
    continue;
  }
  if (!/^3\.1\./.test(String(doc.openapi ?? ""))) {
    errors.push(`${file}: expected openapi 3.1.x, found "${doc.openapi}"`);
  }
  if (!doc.info?.version) {
    errors.push(`${file}: missing info.version (contract changes require a version bump)`);
  }

  // Server URLs already end in /v1, so operation paths must be bare (/assessment).
  const servers = Array.isArray(doc.servers) ? doc.servers : [];
  if (!servers.length || !servers.every((s) => /\/v1\/?$/.test(String(s.url ?? "")))) {
    errors.push(`${file}: every server URL must end in /v1`);
  }

  const paths = doc.paths ?? {};
  // A path that re-adds the /v1 prefix would produce /v1/v1/... at runtime.
  for (const p of Object.keys(paths)) {
    if (p.startsWith("/v1/")) {
      errors.push(
        `${file}: path "${p}" must not include the /v1 prefix (server URL already ends in /v1)`,
      );
    }
  }

  const op = paths[path]?.post;
  if (!op) {
    errors.push(`${file}: missing POST ${path}`);
    continue;
  }
  if (op.operationId !== operationId) {
    errors.push(
      `${file}: POST ${path} operationId should be "${operationId}", found "${op.operationId}"`,
    );
  }
  if (!op.responses || Object.keys(op.responses).length === 0) {
    errors.push(`${file}: POST ${path} declares no responses`);
  }

  console.log(
    `OK ${file}: openapi ${doc.openapi}, info.version ${doc.info?.version}, POST ${path} (${operationId})`,
  );
}

if (errors.length) {
  console.error("\nContract validation FAILED:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log("\nAll OpenAPI contracts parse and satisfy the repo invariants.");
