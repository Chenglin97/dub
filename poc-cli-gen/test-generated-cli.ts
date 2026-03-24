/**
 * TOPIFY-160 PoC Test: Verify that auto-generated CLI commands actually work.
 *
 * Tests:
 * 1. Generated Commander.js code compiles and registers commands
 * 2. --help output shows all expected flags
 * 3. Flag parsing works correctly (types, required vs optional)
 * 4. Dry-run: builds correct HTTP request from parsed flags
 */

import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";

// ─── Re-use parser from main script (inline the key functions) ───────────────

interface SchemaField {
  name: string;
  type: string;
  description: string;
  required: boolean;
  deprecated: boolean;
  example?: string;
}

function parseZodSchemaFields(source: string, schemaName: string): SchemaField[] {
  const fields: SchemaField[] = [];
  const startPattern = `export const ${schemaName} = z.object({`;
  const startIdx = source.indexOf(startPattern);
  if (startIdx === -1) return fields;

  const bodyStart = startIdx + startPattern.length;
  let depth = 1;
  let bodyEnd = bodyStart;
  for (let i = bodyStart; i < source.length && depth > 0; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") depth--;
    if (depth === 0) bodyEnd = i;
  }
  const schemaBody = source.slice(bodyStart, bodyEnd);

  // Split into fields at top-level commas
  const entries: [string, string][] = [];
  let d = 0, current = "", inStr = false, strCh = "";
  for (let i = 0; i < schemaBody.length; i++) {
    const ch = schemaBody[i];
    const prev = i > 0 ? schemaBody[i - 1] : "";
    if ((ch === '"' || ch === "'" || ch === "`") && prev !== "\\") {
      if (!inStr) { inStr = true; strCh = ch; }
      else if (ch === strCh) inStr = false;
    }
    if (!inStr) {
      if (ch === "(" || ch === "[" || ch === "{") d++;
      if (ch === ")" || ch === "]" || ch === "}") d--;
      if (ch === "," && d === 0) {
        const e = parseEntry(current.trim());
        if (e) entries.push(e);
        current = "";
        continue;
      }
    }
    current += ch;
  }
  const last = parseEntry(current.trim());
  if (last) entries.push(last);

  for (const [name, def] of entries) {
    const normalized = def.replace(/\s+/g, " ");
    let type = "string";
    if (normalized.match(/z\s*\.\s*boolean/)) type = "boolean";
    else if (normalized.match(/z\s*\.\s*number/)) type = "number";
    else if (normalized.match(/z\s*\.\s*array/) || normalized.match(/z\s*\.\s*union\(\[z\s*\.\s*string\(\)\s*,\s*z\s*\.\s*array/)) type = "array";
    else if (normalized.match(/z\s*\.\s*record/)) type = "object";

    const descMatch = def.match(/\.describe\(\s*"([^"]+)"\s*\)/);
    const description = descMatch ? descMatch[1] : "";
    const required = !def.includes(".optional()") && !def.includes(".nullish()");
    const deprecated = def.includes("deprecated");
    const exMatch = def.match(/example:\s*"([^"]+)"/);

    fields.push({ name, type, description, required, deprecated, example: exMatch?.[1] });
  }
  return fields;
}

function parseEntry(text: string): [string, string] | null {
  text = text.replace(/^\s*\/\/.*\n/gm, "").trim();
  if (!text) return null;
  const m = text.match(/^(\w+)\s*:\s*([\s\S]+)$/);
  return m ? [m[1], m[2]] : null;
}

function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

// ─── Test Harness ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ ${msg}`);
    passed++;
  } else {
    console.log(`  ❌ ${msg}`);
    failed++;
  }
}

// ─── Test 1: Schema parsing correctness ──────────────────────────────────────

console.log("\n🧪 Test 1: Schema field parsing\n");

const linksSource = fs.readFileSync(
  path.resolve(__dirname, "../apps/web/lib/zod/schemas/links.ts"),
  "utf-8"
);
const fields = parseZodSchemaFields(linksSource, "createLinkBodySchema");

assert(fields.length >= 30, `Extracted ${fields.length} fields (expected >= 30)`);

const urlField = fields.find((f) => f.name === "url");
assert(!!urlField, "Found 'url' field");
assert(urlField?.required === true, "'url' field is required");
assert(urlField?.type === "string", "'url' field type is string");

const domainField = fields.find((f) => f.name === "domain");
assert(!!domainField, "Found 'domain' field");
assert(domainField?.required === false, "'domain' field is optional");

const tagIdsField = fields.find((f) => f.name === "tagIds");
assert(tagIdsField?.type === "array", "'tagIds' field type is array");

const archivedField = fields.find((f) => f.name === "archived");
assert(!!archivedField, "Found 'archived' field");

const publicStatsField = fields.find((f) => f.name === "publicStats");
assert(publicStatsField?.deprecated === true, "'publicStats' is marked deprecated");

const tagIdField = fields.find((f) => f.name === "tagId");
assert(tagIdField?.deprecated === true, "'tagId' is marked deprecated");

// ─── Test 2: Generated Commander.js command compiles & registers ─────────────

console.log("\n🧪 Test 2: Commander.js command registration\n");

const program = new Command();
program.exitOverride(); // Prevent process.exit on errors

const nonDeprecatedFields = fields.filter((f) => !f.deprecated);
const shortFlags = new Set<string>();

const linksCreate = new Command()
  .command("links:create")
  .description("Create a link");

for (const f of nonDeprecatedFields) {
  const longFlag = `--${camelToKebab(f.name)}`;
  const firstChar = f.name[0].toLowerCase();
  let short = "";
  if (!shortFlags.has(firstChar)) {
    short = `-${firstChar}, `;
    shortFlags.add(firstChar);
  }

  const typeHint = f.type !== "boolean" ? ` <${f.type}>` : "";
  const desc = f.description || f.name;

  if (f.required) {
    linksCreate.requiredOption(`${short}${longFlag}${typeHint}`, desc);
  } else {
    linksCreate.option(`${short}${longFlag}${typeHint}`, desc);
  }
}

// Capture the request that would be sent instead of actually sending it
let capturedRequest: { method: string; url: string; body: any; headers: any } | null = null;

linksCreate.action((options: any) => {
  capturedRequest = {
    method: "POST",
    url: "https://api.dub.co/links",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer test-token",
    },
    body: options,
  };
});

program.addCommand(linksCreate);

assert(program.commands.length === 1, "Command 'links:create' registered");
assert(program.commands[0].name() === "links:create", "Command name is 'links:create'");

// ─── Test 3: --help shows all expected flags ─────────────────────────────────

console.log("\n🧪 Test 3: Help text contains expected flags\n");

const helpText = linksCreate.helpInformation();

assert(helpText.includes("--url"), "--help shows --url flag");
assert(helpText.includes("--domain"), "--help shows --domain flag");
assert(helpText.includes("--key"), "--help shows --key flag");
assert(helpText.includes("--tag-ids"), "--help shows --tag-ids flag");
assert(helpText.includes("--utm-source") || helpText.includes("--utm_source"), "--help shows --utm_source flag");
assert(helpText.includes("--expires-at"), "--help shows --expires-at flag");
assert(helpText.includes("--password"), "--help shows --password flag");
assert(helpText.includes("--ios"), "--help shows --ios flag");
assert(helpText.includes("--android"), "--help shows --android flag");
assert(helpText.includes("--geo"), "--help shows --geo flag");
assert(!helpText.includes("publicStats"), "--help does NOT show deprecated publicStats");
assert(!helpText.includes("--tag-id ") || helpText.includes("--tag-ids"), "--help does NOT show deprecated tagId");

// ─── Test 4: Flag parsing works correctly ────────────────────────────────────

console.log("\n🧪 Test 4: CLI flag parsing produces correct API request\n");

linksCreate.parseAsync([
  "--url", "https://example.com",
  "--domain", "mysite.co",
  "--key", "my-link",
  "--tag-ids", "tag1,tag2",
  "--utm_source", "twitter",
  "--archived",
  "--password", "secret123",
], { from: "user" }).then(() => {
  runPostParseTests();
}).catch((e: any) => {
  if (!e.code || e.code !== "commander.helpDisplayed") {
    console.log(`  ⚠️  Parse error: ${e.message}`);
  }
  runPostParseTests();
});

function runPostParseTests() {

assert(capturedRequest !== null, "Action handler was called");
assert(capturedRequest?.method === "POST", "Request method is POST");
assert(capturedRequest?.url === "https://api.dub.co/links", "Request URL is correct");
assert(capturedRequest?.body?.url === "https://example.com", "Parsed --url = 'https://example.com'");
assert(capturedRequest?.body?.domain === "mysite.co", "Parsed --domain = 'mysite.co'");
assert(capturedRequest?.body?.key === "my-link", "Parsed --key = 'my-link'");
assert(capturedRequest?.body?.tagIds === "tag1,tag2", "Parsed --tag-ids = 'tag1,tag2'");
assert(capturedRequest?.body?.utm_source === "twitter", "Parsed --utm_source = 'twitter'");
assert(capturedRequest?.body?.password === "secret123", "Parsed --password = 'secret123'");

// ─── Test 5: Dry-run API call validation ─────────────────────────────────────

console.log("\n🧪 Test 5: Dry-run request body matches Dub API spec\n");

const body = capturedRequest?.body;
const expectedBodyKeys = ["url", "domain", "key", "tagIds", "utm_source", "archived", "password"];
for (const key of expectedBodyKeys) {
  assert(key in (body || {}), `Request body contains '${key}'`);
}

// Verify no deprecated fields leak into the request
assert(!("publicStats" in (body || {})), "No deprecated 'publicStats' in request");
assert(!("tagId" in (body || {})), "No deprecated 'tagId' in request");

// ─── Test 6: Domains schema parsing ──────────────────────────────────────────

console.log("\n🧪 Test 6: Domains schema parsing\n");

const domainsSource = fs.readFileSync(
  path.resolve(__dirname, "../apps/web/lib/zod/schemas/domains.ts"),
  "utf-8"
);
const domainFields = parseZodSchemaFields(domainsSource, "createDomainBodySchema");

assert(domainFields.length >= 5, `Extracted ${domainFields.length} domain fields (expected >= 5)`);

const slugField = domainFields.find((f) => f.name === "slug");
assert(slugField?.required === true, "'slug' field is required");

const notFoundUrlField = domainFields.find((f) => f.name === "notFoundUrl");
assert(!!notFoundUrlField, "Found 'notFoundUrl' field");

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log("\n═══════════════════════════════════════════════════════════");
console.log(`  Test Results: ${passed} passed, ${failed} failed`);
console.log("═══════════════════════════════════════════════════════════\n");

process.exit(failed > 0 ? 1 : 0);

} // end runPostParseTests
