/**
 * TOPIFY-160 PoC: Auto-generate CLI commands from Zod schemas + OpenAPI definitions
 *
 * This script parses Dub.co's source code to:
 * 1. Extract Zod schema field definitions (name, type, description, required/optional)
 * 2. Map them to OpenAPI endpoints (method, path, operationId)
 * 3. Auto-generate CLI command definitions (flags, help text, validation)
 *
 * Usage: npx tsx poc-cli-gen/parse-schema-to-cli.ts
 */

import * as fs from "fs";
import * as path from "path";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SchemaField {
  name: string;
  type: string; // "string" | "boolean" | "number" | "array" | "object"
  description: string;
  required: boolean;
  deprecated: boolean;
  example?: string;
  maxLength?: number;
}

interface OpenAPIEndpoint {
  operationId: string;
  method: string;
  path: string;
  summary: string;
  tag: string;
}

interface CLICommand {
  name: string; // e.g., "links:create"
  description: string;
  endpoint: OpenAPIEndpoint;
  flags: CLIFlag[];
}

interface CLIFlag {
  long: string; // --url
  short?: string; // -u
  type: string;
  description: string;
  required: boolean;
  example?: string;
}

// ─── Schema Parser ───────────────────────────────────────────────────────────

/**
 * Parse a Zod schema source file and extract field definitions.
 * This uses regex-based parsing on the raw TypeScript source — no AST needed for the PoC.
 */
function parseZodSchemaFields(source: string, schemaName: string): SchemaField[] {
  const fields: SchemaField[] = [];

  // Try multiple patterns for finding the schema body:
  // 1. `export const X = z.object({`
  // 2. `export const X = SomeSchema.extend({`
  // 3. `export const X = z\n  .object({`
  // 4. `export const X = SomeSchema.partial().extend({`
  const patterns = [
    `export const ${schemaName} = z.object({`,
    `export const ${schemaName} = z\n  .object({`,
  ];

  let startIdx = -1;
  let bodyStart = -1;

  // First try exact z.object patterns
  for (const pattern of patterns) {
    startIdx = source.indexOf(pattern);
    if (startIdx !== -1) {
      bodyStart = startIdx + pattern.length;
      break;
    }
  }

  // If not found, use regex to match .extend({ or z.object({ with flexible whitespace
  if (startIdx === -1) {
    const extendRegex = new RegExp(
      `export\\s+const\\s+${schemaName}\\s*=\\s*[\\w.()]+\\.extend\\(\\{`
    );
    const objRegex = new RegExp(
      `export\\s+const\\s+${schemaName}\\s*=\\s*z\\s*\\.\\s*object\\(\\{`
    );
    const extMatch = source.match(extendRegex);
    const objMatch = source.match(objRegex);
    const match = extMatch || objMatch;
    if (match && match.index !== undefined) {
      startIdx = match.index;
      bodyStart = startIdx + match[0].length;
    }
  }

  if (startIdx === -1 || bodyStart === -1) {
    console.warn(`Schema "${schemaName}" not found in source`);
    return fields;
  }

  // Also try to resolve the base schema (for .extend patterns)
  // e.g., LinksQuerySchema.extend({...}) — we should also parse LinksQuerySchema fields
  // Handle .partial() — makes all base fields optional
  const declaration = source.slice(startIdx, bodyStart);
  const extendMatch = declaration.match(/=\s*(\w+)\.(extend|partial)/);
  if (extendMatch) {
    const baseSchemaName = extendMatch[1];
    const isPartial = declaration.includes(".partial()");
    const baseFields = parseZodSchemaFields(source, baseSchemaName);
    if (isPartial) {
      fields.push(...baseFields.map((f) => ({ ...f, required: false })));
    } else {
      fields.push(...baseFields);
    }
  }

  // Find the matching closing brace using balanced brace counting
  let depth = 1;
  let bodyEnd = bodyStart;
  for (let i = bodyStart; i < source.length && depth > 0; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") depth--;
    if (depth === 0) bodyEnd = i;
  }

  const schemaBody = source.slice(bodyStart, bodyEnd);

  // Match each field: `fieldName: z.<type>...`
  // We need to handle nested parens/brackets, so we use a state machine approach
  const fieldEntries = splitSchemaFields(schemaBody);

  for (const [fieldName, fieldDef] of fieldEntries) {
    const field = parseFieldDefinition(fieldName, fieldDef);
    if (field) {
      fields.push(field);
    }
  }

  return fields;
}

/**
 * Split a Zod schema body into individual field entries.
 * Handles nested parens, brackets, and braces.
 */
function splitSchemaFields(body: string): [string, string][] {
  const results: [string, string][] = [];
  let depth = 0;
  let current = "";
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    const prev = i > 0 ? body[i - 1] : "";

    // Track string boundaries
    if ((ch === '"' || ch === "'" || ch === "`") && prev !== "\\") {
      if (!inString) {
        inString = true;
        stringChar = ch;
      } else if (ch === stringChar) {
        inString = false;
      }
    }

    if (!inString) {
      if (ch === "(" || ch === "[" || ch === "{") depth++;
      if (ch === ")" || ch === "]" || ch === "}") depth--;

      // Field separator at top level
      if (ch === "," && depth === 0) {
        const entry = parseFieldEntry(current.trim());
        if (entry) results.push(entry);
        current = "";
        continue;
      }
    }

    current += ch;
  }

  // Last field (no trailing comma)
  const entry = parseFieldEntry(current.trim());
  if (entry) results.push(entry);

  return results;
}

function parseFieldEntry(text: string): [string, string] | null {
  if (!text) return null;

  // Remove leading comments
  text = text.replace(/^\s*\/\/.*\n/gm, "").trim();
  if (!text) return null;

  // Match: fieldName: <definition>
  const match = text.match(/^(\w+)\s*:\s*([\s\S]+)$/);
  if (!match) return null;

  return [match[1], match[2]];
}

/**
 * Parse a single field definition string into a SchemaField.
 */
function parseFieldDefinition(name: string, def: string): SchemaField | null {
  // Normalize whitespace for type detection
  const normalized = def.replace(/\s+/g, " ");

  // Extract type
  let type = "string";
  if (normalized.match(/z\s*\.\s*boolean/)) type = "boolean";
  else if (normalized.match(/z\s*\.\s*number/)) type = "number";
  else if (normalized.match(/z\s*\.\s*array/)) type = "array";
  else if (normalized.match(/z\s*\.\s*record/)) type = "object";
  else if (normalized.match(/z\s*\.\s*union\(\[z\s*\.\s*string\(\)\s*,\s*z\s*\.\s*array/)) type = "array";
  else if (normalized.includes("parseUrlSchema")) type = "string";

  // Extract description
  const descMatch = def.match(/\.describe\(\s*"([^"]+)"\s*\)/);
  const description = descMatch ? descMatch[1] : "";

  // Check if optional/nullish
  const required = !def.includes(".optional()") && !def.includes(".nullish()");

  // Check if deprecated
  const deprecated = def.includes("deprecated");

  // Extract example
  const exampleMatch = def.match(/example:\s*"([^"]+)"/);
  const example = exampleMatch ? exampleMatch[1] : undefined;

  // Extract maxLength
  const maxLenMatch = def.match(/maxLength:\s*(\d+)/);
  const maxLength = maxLenMatch ? parseInt(maxLenMatch[1]) : undefined;

  return { name, type, description, required, deprecated, example, maxLength };
}

// ─── OpenAPI Endpoint Parser ─────────────────────────────────────────────────

/**
 * Parse OpenAPI path definitions from source files.
 */
function parseOpenAPIEndpoints(indexSource: string, dir: string): OpenAPIEndpoint[] {
  const endpoints: OpenAPIEndpoint[] = [];

  // Parse the paths object: "/links": { post: createLink, get: getLinks }
  const pathRegex = /"([^"]+)":\s*\{([^}]+)\}/g;
  let pathMatch;

  while ((pathMatch = pathRegex.exec(indexSource)) !== null) {
    const apiPath = pathMatch[1];
    const methods = pathMatch[2];

    // Parse methods: post: createLink, get: getLinks
    const methodRegex = /(\w+):\s*(\w+)/g;
    let methodMatch;

    while ((methodMatch = methodRegex.exec(methods)) !== null) {
      const method = methodMatch[1];
      const operationRef = methodMatch[2];

      // Try to read the individual operation file for summary
      const opFile = camelToKebab(operationRef) + ".ts";
      const opPath = path.join(dir, opFile);
      let summary = operationRef;
      let tag = "Links";

      if (fs.existsSync(opPath)) {
        const opSource = fs.readFileSync(opPath, "utf-8");
        const summaryMatch = opSource.match(/summary:\s*"([^"]+)"/);
        if (summaryMatch) summary = summaryMatch[1];
        const tagMatch = opSource.match(/tags:\s*\["([^"]+)"\]/);
        if (tagMatch) tag = tagMatch[1];
      }

      endpoints.push({
        operationId: operationRef,
        method: method.toUpperCase(),
        path: apiPath,
        summary,
        tag,
      });
    }
  }

  return endpoints;
}

function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

// ─── CLI Generator ───────────────────────────────────────────────────────────

/**
 * Map schema fields to CLI flags.
 */
function fieldsToFlags(fields: SchemaField[]): CLIFlag[] {
  const shortFlags = new Set<string>();

  return fields
    .filter((f) => !f.deprecated) // Skip deprecated fields
    .map((f) => {
      // Generate short flag from first letter (if available)
      const firstChar = f.name[0].toLowerCase();
      let short: string | undefined;
      if (!shortFlags.has(firstChar)) {
        short = `-${firstChar}`;
        shortFlags.add(firstChar);
      }

      return {
        long: `--${camelToKebab(f.name)}`,
        short,
        type: f.type,
        description: f.description,
        required: f.required,
        example: f.example,
      };
    });
}

/**
 * Map an endpoint + schema to a CLI command definition.
 */
function generateCLICommand(
  endpoint: OpenAPIEndpoint,
  schemaName: string,
  fields: SchemaField[]
): CLICommand {
  const tag = endpoint.tag.toLowerCase();
  const action = endpoint.operationId
    .replace(/^(create|get|update|delete|upsert|bulk)/, "$1")
    .replace(endpoint.tag, "")
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");

  // Generate unique command name from operationId
  let cmdName: string;
  // Convert operationId like "createLink" -> "links:create", "bulkCreateLinks" -> "links:bulk-create"
  const opId = endpoint.operationId;
  if (opId.startsWith("bulk")) {
    const action = opId.replace("bulk", "").replace(/Links?$/, "");
    cmdName = `${tag}:bulk-${action.toLowerCase()}`;
  } else {
    // Extract verb from operationId: createLink -> create, getLinks -> list, getLinkInfo -> info, getLinksCount -> count
    let verb = opId.replace(/Links?$/, "").replace(/Domains?$/, "").replace(/Status$/, "");
    // Map common verbs
    if (verb === "get" && opId.includes("Count")) verb = "count";
    else if (verb === "get" && opId.includes("Info")) verb = "info";
    else if (verb === "get" && opId.includes("Status")) verb = "status";
    else if (verb === "get" || verb === "list") verb = "list";
    else if (verb === "getLinkInfo") verb = "info";
    else if (verb === "getLinksCount") verb = "count";
    else if (verb === "check") verb = "check";
    else if (verb === "checkDomain") verb = "check";
    else if (verb === "register") verb = "register";

    // More specific extraction from operationId
    if (opId === "getLinkInfo") verb = "info";
    else if (opId === "getLinksCount") verb = "count";
    else if (opId === "getLinks" || opId === "listDomains") verb = "list";
    else if (opId === "checkDomainStatus") verb = "check-status";
    else if (opId === "registerDomain") verb = "register";
    else if (opId === "createLink" || opId === "createDomain") verb = "create";
    else if (opId === "updateLink" || opId === "updateDomain") verb = "update";
    else if (opId === "deleteLink" || opId === "deleteDomain") verb = "delete";
    else if (opId === "upsertLink") verb = "upsert";

    cmdName = `${tag}:${verb}`;
  }

  return {
    name: cmdName,
    description: endpoint.summary,
    endpoint,
    flags: fieldsToFlags(fields),
  };
}

// ─── Output Formatters ───────────────────────────────────────────────────────

/**
 * Generate a Commander.js-style CLI command definition.
 */
function formatAsCommanderJS(cmd: CLICommand): string {
  const lines: string[] = [];
  lines.push(`// Auto-generated CLI command for: ${cmd.endpoint.method} ${cmd.endpoint.path}`);
  lines.push(`// Source: ${cmd.endpoint.operationId}`);
  lines.push("");
  lines.push(`import { Command } from "commander";`);
  lines.push("");
  lines.push(`export const ${toCamelCase(cmd.name.replace(":", "-"))} = new Command()`);
  lines.push(`  .command("${cmd.name}")`);
  lines.push(`  .description("${cmd.description}")`);

  for (const flag of cmd.flags) {
    const flagStr = flag.short
      ? `${flag.short}, ${flag.long}`
      : flag.long;

    const typeHint = flag.type !== "boolean" ? ` <${flag.type}>` : "";
    const desc = flag.description || flag.long;

    if (flag.required) {
      lines.push(`  .requiredOption("${flagStr}${typeHint}", "${desc}")`);
    } else {
      lines.push(`  .option("${flagStr}${typeHint}", "${desc}")`);
    }
  }

  lines.push(`  .action(async (options) => {`);
  lines.push(`    const response = await fetch(\`\${API_BASE}${cmd.endpoint.path}\`, {`);
  lines.push(`      method: "${cmd.endpoint.method}",`);
  if (cmd.endpoint.method !== "GET" && cmd.endpoint.method !== "DELETE") {
    lines.push(`      headers: { "Content-Type": "application/json", Authorization: \`Bearer \${token}\` },`);
    lines.push(`      body: JSON.stringify(options),`);
  } else {
    lines.push(`      headers: { Authorization: \`Bearer \${token}\` },`);
  }
  lines.push(`    });`);
  lines.push(`    const data = await response.json();`);
  lines.push(`    console.log(JSON.stringify(data, null, 2));`);
  lines.push(`  });`);
  lines.push("");

  return lines.join("\n");
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Generate a curl example for the endpoint.
 */
function formatAsCurl(cmd: CLICommand): string {
  const lines: string[] = [];
  lines.push(`# ${cmd.description}`);
  lines.push(`# ${cmd.endpoint.method} ${cmd.endpoint.path}`);

  let curl = `curl -X ${cmd.endpoint.method} "https://api.dub.co${cmd.endpoint.path}"`;
  curl += ` \\\n  -H "Authorization: Bearer $DUB_API_KEY"`;

  if (cmd.endpoint.method !== "GET" && cmd.endpoint.method !== "DELETE") {
    curl += ` \\\n  -H "Content-Type: application/json"`;

    const bodyFields: Record<string, string> = {};
    for (const flag of cmd.flags.filter((f) => f.required || f.example)) {
      bodyFields[flag.long.replace("--", "").replace(/-([a-z])/g, (_, c) => c.toUpperCase())] =
        flag.example || `<${flag.type}>`;
    }

    if (Object.keys(bodyFields).length > 0) {
      curl += ` \\\n  -d '${JSON.stringify(bodyFields, null, 2)}'`;
    }
  }

  lines.push(curl);
  return lines.join("\n");
}

/**
 * Generate a help-text summary (like --help output).
 */
function formatAsHelp(cmd: CLICommand): string {
  const lines: string[] = [];
  lines.push(`  ${cmd.name} - ${cmd.description}`);
  lines.push(`  API: ${cmd.endpoint.method} ${cmd.endpoint.path}`);
  lines.push("");

  const requiredFlags = cmd.flags.filter((f) => f.required);
  const optionalFlags = cmd.flags.filter((f) => !f.required);

  if (requiredFlags.length > 0) {
    lines.push("  Required flags:");
    for (const f of requiredFlags) {
      const shortStr = f.short ? `${f.short}, ` : "    ";
      lines.push(`    ${shortStr}${f.long.padEnd(25)} ${f.description}`);
    }
    lines.push("");
  }

  if (optionalFlags.length > 0) {
    lines.push("  Optional flags:");
    for (const f of optionalFlags) {
      const shortStr = f.short ? `${f.short}, ` : "    ";
      lines.push(`    ${shortStr}${f.long.padEnd(25)} ${f.description}`);
    }
  }

  return lines.join("\n");
}

// ─── Comparison with existing CLI ────────────────────────────────────────────

function compareWithExistingCLI(generatedFields: SchemaField[], existingCLISource: string): string {
  const lines: string[] = [];

  // Extract flags from existing CLI
  const existingFlags = new Set<string>();
  const flagRegex = /\.option\("([^"]+)"/g;
  let m;
  while ((m = flagRegex.exec(existingCLISource)) !== null) {
    const flag = m[1].split(",").pop()?.trim().split(" ")[0]?.replace("--", "") || "";
    if (flag) existingFlags.add(flag);
  }

  // Extract arguments
  const argRegex = /\.argument\("([^"]+)"/g;
  while ((m = argRegex.exec(existingCLISource)) !== null) {
    const arg = m[1].replace(/[\[\]<>]/g, "").trim();
    if (arg) existingFlags.add(arg);
  }

  const schemaFields = new Set(generatedFields.filter((f) => !f.deprecated).map((f) => f.name));

  const missing = [...schemaFields].filter((f) => !existingFlags.has(f));
  const extra = [...existingFlags].filter((f) => !schemaFields.has(f));

  lines.push("┌─────────────────────────────────────────────────────┐");
  lines.push("│         COVERAGE COMPARISON: Existing vs Generated  │");
  lines.push("├─────────────────────────────────────────────────────┤");
  lines.push(`│  Schema fields (non-deprecated): ${schemaFields.size.toString().padStart(3)}               │`);
  lines.push(`│  Existing CLI covers:            ${existingFlags.size.toString().padStart(3)}               │`);
  lines.push(`│  Missing in existing CLI:        ${missing.length.toString().padStart(3)}               │`);
  lines.push("├─────────────────────────────────────────────────────┤");

  if (missing.length > 0) {
    lines.push("│  Fields NOT in existing CLI:                        │");
    for (const f of missing) {
      lines.push(`│    - ${f.padEnd(45)} │`);
    }
  }

  lines.push("└─────────────────────────────────────────────────────┘");

  return lines.join("\n");
}

// ─── Endpoint-to-Schema Mapping ──────────────────────────────────────────────

interface EndpointSchemaMapping {
  operationId: string;
  schemaName: string;
  schemaFile: string; // "links" or "domains"
  paramType: "body" | "query" | "path"; // where the schema is used
}

const ENDPOINT_SCHEMA_MAP: EndpointSchemaMapping[] = [
  // Links
  { operationId: "createLink",     schemaName: "createLinkBodySchema",     schemaFile: "links",   paramType: "body" },
  { operationId: "getLinks",       schemaName: "getLinksQuerySchemaBase",  schemaFile: "links",   paramType: "query" },
  { operationId: "getLinksCount",  schemaName: "getLinksCountQuerySchema", schemaFile: "links",   paramType: "query" },
  { operationId: "getLinkInfo",    schemaName: "getLinkInfoQuerySchema",   schemaFile: "links",   paramType: "query" },
  { operationId: "updateLink",     schemaName: "createLinkBodySchema",     schemaFile: "links",   paramType: "body" },  // updateLinkBodySchema = createLinkBodySchema.partial()
  { operationId: "deleteLink",     schemaName: "",                         schemaFile: "links",   paramType: "path" },  // just linkId path param
  { operationId: "bulkCreateLinks", schemaName: "createLinkBodySchema",    schemaFile: "links",   paramType: "body" },  // array of createLinkBodySchema
  { operationId: "bulkUpdateLinks", schemaName: "bulkUpdateLinksBodySchema", schemaFile: "links", paramType: "body" },
  { operationId: "bulkDeleteLinks", schemaName: "",                        schemaFile: "links",   paramType: "query" }, // inline linkIds query
  { operationId: "upsertLink",    schemaName: "createLinkBodySchema",     schemaFile: "links",   paramType: "body" },
  // Domains
  { operationId: "createDomain",   schemaName: "createDomainBodySchema",   schemaFile: "domains", paramType: "body" },
  { operationId: "listDomains",    schemaName: "getDomainsQuerySchema",    schemaFile: "domains", paramType: "query" },
  { operationId: "updateDomain",   schemaName: "createDomainBodySchema",   schemaFile: "domains", paramType: "body" },  // updateDomainBodySchema = createDomainBodySchema.partial()
  { operationId: "deleteDomain",   schemaName: "",                         schemaFile: "domains", paramType: "path" },  // just slug path param
  { operationId: "registerDomain", schemaName: "registerDomainSchema",     schemaFile: "domains", paramType: "body" },
  { operationId: "checkDomainStatus", schemaName: "searchDomainSchema",    schemaFile: "domains", paramType: "query" },
];

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const baseDir = path.resolve(__dirname, "..");

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  TOPIFY-160 PoC: UI Schema → CLI Command Auto-Generator  ");
  console.log("  Target: Dub.co (Open Source URL Shortener)               ");
  console.log("  Mode: Full 16-endpoint generation                        ");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");

  // ── Step 1: Load all schema sources ────────────────────────────────────

  console.log("Step 1: Loading schema sources...\n");

  const schemaSources: Record<string, string> = {
    links: fs.readFileSync(path.join(baseDir, "apps/web/lib/zod/schemas/links.ts"), "utf-8"),
    domains: fs.readFileSync(path.join(baseDir, "apps/web/lib/zod/schemas/domains.ts"), "utf-8"),
  };

  // Parse all unique schemas
  const parsedSchemas: Record<string, SchemaField[]> = {};
  const uniqueSchemas = new Set(ENDPOINT_SCHEMA_MAP.map((m) => m.schemaName).filter(Boolean));

  for (const schemaName of uniqueSchemas) {
    const mapping = ENDPOINT_SCHEMA_MAP.find((m) => m.schemaName === schemaName)!;
    const source = schemaSources[mapping.schemaFile];
    const fields = parseZodSchemaFields(source, schemaName);
    parsedSchemas[schemaName] = fields;
    console.log(`  ✓ ${schemaName}: ${fields.length} fields`);
  }

  // ── Step 2: Discover all OpenAPI endpoints ─────────────────────────────

  console.log("\nStep 2: Discovering OpenAPI endpoints...\n");

  const allEndpoints: OpenAPIEndpoint[] = [];

  for (const resource of ["links", "domains"]) {
    const openAPIDir = path.join(baseDir, `apps/web/lib/openapi/${resource}`);
    const indexPath = path.join(openAPIDir, "index.ts");
    if (fs.existsSync(indexPath)) {
      const indexSource = fs.readFileSync(indexPath, "utf-8");
      const endpoints = parseOpenAPIEndpoints(indexSource, openAPIDir);
      allEndpoints.push(...endpoints);
      for (const ep of endpoints) {
        console.log(`  ✓ ${ep.method.padEnd(6)} ${ep.path.padEnd(25)} → ${ep.summary}`);
      }
    }
  }

  // ── Step 3: Generate CLI commands for ALL endpoints ────────────────────

  console.log("\nStep 3: Generating CLI commands for all endpoints...\n");

  const allCommands: CLICommand[] = [];
  let totalFlags = 0;

  for (const endpoint of allEndpoints) {
    const mapping = ENDPOINT_SCHEMA_MAP.find((m) => m.operationId === endpoint.operationId);

    let fields: SchemaField[] = [];
    let schemaNote = "";

    if (mapping && mapping.schemaName && parsedSchemas[mapping.schemaName]) {
      fields = parsedSchemas[mapping.schemaName];
      schemaNote = `${mapping.schemaName} (${mapping.paramType})`;
    } else if (mapping && !mapping.schemaName) {
      // Endpoints with only path params (delete, etc.)
      if (endpoint.path.includes("{linkId}")) {
        fields = [{ name: "linkId", type: "string", description: "The unique ID of the link.", required: true, deprecated: false }];
      } else if (endpoint.path.includes("{slug}")) {
        fields = [{ name: "slug", type: "string", description: "The domain slug.", required: true, deprecated: false }];
      }
      if (endpoint.operationId === "bulkDeleteLinks") {
        fields = [{ name: "linkIds", type: "array", description: "Comma-separated link IDs to delete.", required: true, deprecated: false }];
      }
      schemaNote = "path/inline params";
    } else {
      schemaNote = "⚠ no schema mapping";
    }

    // For update endpoints, make all fields optional (since schema is .partial())
    if (endpoint.operationId.startsWith("update")) {
      fields = fields.map((f) => ({ ...f, required: false }));
    }

    const cmd = generateCLICommand(endpoint, "", fields);
    allCommands.push(cmd);

    const nonDeprecated = cmd.flags.length;
    totalFlags += nonDeprecated;

    const status = fields.length > 0 ? "✅" : "⚠️";
    console.log(`  ${status} ${cmd.name.padEnd(30)} ${nonDeprecated.toString().padStart(3)} flags  [${schemaNote}]`);
  }

  // ── Step 4: Output all generated commands ──────────────────────────────

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  GENERATED CLI COMMANDS (Help Text)                       ");
  console.log("═══════════════════════════════════════════════════════════\n");

  for (const cmd of allCommands) {
    console.log(formatAsHelp(cmd));
    console.log("");
    console.log("  " + "─".repeat(55));
    console.log("");
  }

  // ── Step 5: Output all curl examples ───────────────────────────────────

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  GENERATED CURL EXAMPLES                                  ");
  console.log("═══════════════════════════════════════════════════════════\n");

  for (const cmd of allCommands) {
    console.log(formatAsCurl(cmd));
    console.log("");
  }

  // ── Step 6: Write all generated Commander.js code to file ──────────────

  const outputDir = path.join(__dirname, "generated");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Write individual command files
  for (const cmd of allCommands) {
    const code = formatAsCommanderJS(cmd);
    const filename = cmd.name.replace(":", "-") + ".ts";
    fs.writeFileSync(path.join(outputDir, filename), code);
  }

  // Write a combined index.ts that registers all commands
  const indexLines: string[] = [];
  indexLines.push("// Auto-generated CLI for Dub.co — all 16 endpoints");
  indexLines.push('import { Command } from "commander";');
  indexLines.push("");
  indexLines.push('const API_BASE = "https://api.dub.co";');
  indexLines.push("const token = process.env.DUB_API_KEY || \"\";");
  indexLines.push("");
  indexLines.push("const program = new Command();");
  indexLines.push('program.name("dub").description("Auto-generated CLI for Dub.co").version("0.1.0");');
  indexLines.push("");

  for (const cmd of allCommands) {
    const varName = toCamelCase(cmd.name.replace(":", "-"));
    indexLines.push(`// ── ${cmd.name}: ${cmd.description} ──`);
    indexLines.push(`const ${varName} = program`);
    indexLines.push(`  .command("${cmd.name}")`);
    indexLines.push(`  .description("${cmd.description}")`);

    for (const flag of cmd.flags) {
      const flagStr = flag.short ? `${flag.short}, ${flag.long}` : flag.long;
      const typeHint = flag.type !== "boolean" ? ` <${flag.type}>` : "";
      const desc = (flag.description || flag.long).replace(/"/g, '\\"');
      if (flag.required) {
        indexLines.push(`  .requiredOption("${flagStr}${typeHint}", "${desc}")`);
      } else {
        indexLines.push(`  .option("${flagStr}${typeHint}", "${desc}")`);
      }
    }

    // Action: build and send the request
    const isGet = cmd.endpoint.method === "GET";
    const isDelete = cmd.endpoint.method === "DELETE";
    const hasPathParam = cmd.endpoint.path.includes("{");
    indexLines.push(`  .action(async (options) => {`);

    let urlExpr = `\`\${API_BASE}${cmd.endpoint.path}\``;
    if (hasPathParam) {
      // Replace {linkId} or {slug} with options value
      urlExpr = urlExpr.replace("{linkId}", "${options.linkId}").replace("{slug}", "${options.slug}");
    }
    if (isGet) {
      indexLines.push(`    const params = new URLSearchParams();`);
      indexLines.push(`    for (const [k, v] of Object.entries(options)) {`);
      indexLines.push(`      if (v !== undefined) params.set(k, String(v));`);
      indexLines.push(`    }`);
      indexLines.push(`    const url = ${urlExpr} + "?" + params.toString();`);
      indexLines.push(`    const res = await fetch(url, { headers: { Authorization: \`Bearer \${token}\` } });`);
    } else if (isDelete) {
      indexLines.push(`    const res = await fetch(${urlExpr}, {`);
      indexLines.push(`      method: "DELETE",`);
      indexLines.push(`      headers: { Authorization: \`Bearer \${token}\` },`);
      indexLines.push(`    });`);
    } else {
      indexLines.push(`    const res = await fetch(${urlExpr}, {`);
      indexLines.push(`      method: "${cmd.endpoint.method}",`);
      indexLines.push(`      headers: { "Content-Type": "application/json", Authorization: \`Bearer \${token}\` },`);
      indexLines.push(`      body: JSON.stringify(options),`);
      indexLines.push(`    });`);
    }
    indexLines.push(`    const data = await res.json();`);
    indexLines.push(`    console.log(JSON.stringify(data, null, 2));`);
    indexLines.push(`  });`);
    indexLines.push("");
  }

  indexLines.push("program.parse();");
  fs.writeFileSync(path.join(outputDir, "dub-cli.ts"), indexLines.join("\n"));

  console.log(`\nStep 6: Generated files written to ${outputDir}/`);
  console.log(`  ✓ dub-cli.ts (combined CLI — all ${allCommands.length} commands)`);
  for (const cmd of allCommands) {
    console.log(`  ✓ ${cmd.name.replace(":", "-")}.ts`);
  }

  // ── Step 7: Compare with existing CLI ──────────────────────────────────

  console.log("\nStep 7: Comparing with Dub's existing hand-written CLI...\n");

  const existingShortenPath = path.join(baseDir, "packages/cli/src/commands/shorten.ts");
  const existingLinksPath = path.join(baseDir, "packages/cli/src/commands/links.ts");
  const existingDomainsPath = path.join(baseDir, "packages/cli/src/commands/domains.ts");
  let combinedExisting = "";
  for (const p of [existingShortenPath, existingLinksPath, existingDomainsPath]) {
    if (fs.existsSync(p)) combinedExisting += fs.readFileSync(p, "utf-8") + "\n";
  }

  // Count all unique non-deprecated fields across all schemas
  const allFields = new Set<string>();
  for (const cmd of allCommands) {
    for (const flag of cmd.flags) {
      allFields.add(flag.long.replace("--", ""));
    }
  }

  console.log(compareWithExistingCLI(
    // Flatten all fields from all commands
    allCommands.flatMap((cmd) =>
      cmd.flags.map((f) => ({
        name: f.long.replace("--", "").replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
        type: f.type,
        description: f.description,
        required: f.required,
        deprecated: false,
      }))
    ),
    combinedExisting
  ));

  // ── Summary ────────────────────────────────────────────────────────────

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  FINAL RESULTS SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Total schemas parsed:       ${Object.keys(parsedSchemas).length}`);
  console.log(`  Total schema fields:        ${Object.values(parsedSchemas).reduce((sum, f) => sum + f.length, 0)}`);
  console.log(`  API endpoints covered:      ${allCommands.length} / ${allEndpoints.length}`);
  console.log(`  CLI commands generated:     ${allCommands.length}`);
  console.log(`  Total CLI flags generated:  ${totalFlags}`);
  console.log(`  Unique flag names:          ${allFields.size}`);
  console.log("");
  console.log("  All generated code written to: poc-cli-gen/generated/");
  console.log("  Combined CLI: poc-cli-gen/generated/dub-cli.ts");
  console.log("═══════════════════════════════════════════════════════════");
}

main();
