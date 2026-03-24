# TOPIFY-160 PoC: UI Schema to CLI Auto-Generator

This proof-of-concept demonstrates that CLI commands can be **automatically generated** from a SaaS application's source code by parsing its Zod schemas and OpenAPI definitions — no manual CLI authoring required.

**Target project:** [Dub.co](https://github.com/dubinc/dub) (open-source URL shortener)

## Quick Start

### Prerequisites

- Node.js >= 18
- The Dub.co repo cloned as the parent directory (this PoC lives inside `dub-poc/poc-cli-gen/`)

### Install dependencies

```bash
cd poc-cli-gen
npm install
```

### Run the generator

This parses Dub.co's source code and generates CLI commands for all 16 API endpoints:

```bash
npx tsx parse-schema-to-cli.ts
```

Output:
- Prints a full report (schemas parsed, endpoints discovered, coverage comparison)
- Writes generated CLI code to `generated/`

### Run the generated CLI

```bash
# Set your Dub API key
export DUB_API_KEY=your_api_key_here

# See all available commands
npx tsx generated/dub-cli.ts --help

# See help for a specific command
npx tsx generated/dub-cli.ts links:create --help
npx tsx generated/dub-cli.ts domains:create --help
```

### Run tests

```bash
npx tsx test-generated-cli.ts
```

## Usage Examples

### Links

```bash
# Create a short link
npx tsx generated/dub-cli.ts links:create \
  --url "https://example.com/my-long-article" \
  --domain "mysite.co" \
  --key "article" \
  --tag-ids "tag1,tag2" \
  --utm_source "twitter" \
  --utm_campaign "launch"

# Create a short link with expiration and password
npx tsx generated/dub-cli.ts links:create \
  --url "https://example.com/secret-page" \
  --password "s3cret" \
  --expires-at "2026-12-31T23:59:59Z" \
  --expired-url "https://example.com/expired"

# Create a short link with custom OG preview
npx tsx generated/dub-cli.ts links:create \
  --url "https://example.com" \
  --proxy \
  --title "My Custom Title" \
  --description "Custom description for social sharing" \
  --image "https://example.com/og-image.png"

# Create a short link with geo targeting
npx tsx generated/dub-cli.ts links:create \
  --url "https://example.com/global" \
  --geo '{"US":"https://example.com/us","CN":"https://example.com/cn"}'

# List links in your workspace
npx tsx generated/dub-cli.ts links:list

# Get info about a specific link
npx tsx generated/dub-cli.ts links:info --link-id "clux0rgak00011..."

# Update a link
npx tsx generated/dub-cli.ts links:update \
  --url "https://example.com/updated" \
  --archived

# Delete a link
npx tsx generated/dub-cli.ts links:delete --link-id "clux0rgak00011..."

# Upsert a link (create or update by externalId)
npx tsx generated/dub-cli.ts links:upsert \
  --url "https://example.com" \
  --external-id "my-db-id-123"
```

### Bulk Operations

```bash
# Bulk delete links
npx tsx generated/dub-cli.ts links:bulk-delete --link-ids "id1,id2,id3"

# Bulk update links
npx tsx generated/dub-cli.ts links:bulk-update \
  --link-ids "id1,id2" \
  --data '{"url":"https://new-destination.com"}'
```

### Domains

```bash
# Create a custom domain
npx tsx generated/dub-cli.ts domains:create \
  --slug "links.mycompany.com" \
  --not-found-url "https://mycompany.com/404" \
  --expired-url "https://mycompany.com/expired" \
  --placeholder "https://mycompany.com/example-link"

# List all domains
npx tsx generated/dub-cli.ts domains:list

# Update a domain
npx tsx generated/dub-cli.ts domains:update \
  --slug "links.mycompany.com" \
  --archived

# Delete a domain
npx tsx generated/dub-cli.ts domains:delete --slug "links.mycompany.com"

# Register a .link domain
npx tsx generated/dub-cli.ts domains:register --domain "mycompany.link"

# Check domain availability
npx tsx generated/dub-cli.ts domains:check-status --domains "mycompany.link,mybrand.link"
```

## How It Works

The generator follows a 3-step pipeline:

```
Zod Schema (source code)  -->  Schema Parser  -->  CLI Command
     +                                                  |
OpenAPI Endpoint Defs      -->  Endpoint Parser -->  Commander.js code
                                                       + curl examples
                                                       + help text
```

### Step 1: Parse Zod Schemas

The script reads `.ts` files from `apps/web/lib/zod/schemas/` and extracts field definitions from Zod schema objects. For each field it captures:

- **Name** (e.g., `url`, `domain`, `tagIds`)
- **Type** (`string`, `boolean`, `number`, `array`, `object`)
- **Description** (from `.describe("...")`)
- **Required/Optional** (from `.optional()` / `.nullish()`)
- **Deprecated** (from `.meta({ deprecated: true })`)
- **Examples** (from `.meta({ example: "..." })`)

It handles:
- `z.object({...})` — direct schema definitions
- `BaseSchema.extend({...})` — schema inheritance, including parent fields
- `BaseSchema.partial().extend({...})` — partial inheritance (all parent fields become optional)

### Step 2: Parse OpenAPI Endpoints

The script reads `apps/web/lib/openapi/*/index.ts` to discover all API routes and their HTTP methods. For each endpoint it reads the individual operation file to get:

- **operationId** (e.g., `createLink`)
- **HTTP method** (`GET`, `POST`, `PATCH`, `PUT`, `DELETE`)
- **Path** (e.g., `/links`, `/domains/{slug}`)
- **Summary** (human-readable description)

### Step 3: Generate CLI Commands

Each endpoint is mapped to its corresponding Zod schema via the `ENDPOINT_SCHEMA_MAP` configuration. The generator then:

1. Converts schema fields to CLI flags (`--url`, `--domain`, `--archived`)
2. Assigns short flags where possible (`-u`, `-d`, `-a`)
3. Sets boolean fields as flag-only (no value argument)
4. Marks required fields as `.requiredOption()`
5. Filters out deprecated fields
6. Generates the `fetch()` call with correct method, headers, and body/query params

## File Structure

```
poc-cli-gen/
  parse-schema-to-cli.ts     # Main generator script
  test-generated-cli.ts      # Test suite (45 assertions)
  package.json
  README.md                  # This file
  generated/                 # Auto-generated output
    dub-cli.ts               # Combined CLI (all 16 commands)
    links-create.ts          # Individual command files
    links-list.ts
    links-info.ts
    links-count.ts
    links-update.ts
    links-delete.ts
    links-bulk-create.ts
    links-bulk-update.ts
    links-bulk-delete.ts
    links-upsert.ts
    domains-create.ts
    domains-list.ts
    domains-update.ts
    domains-delete.ts
    domains-register.ts
    domains-check-status.ts
```

## Results

| Metric | Value |
|--------|-------|
| Schemas parsed | 9 |
| Schema fields extracted | 62 |
| API endpoints covered | 16 / 16 |
| CLI commands generated | 16 |
| Total CLI flags | 184 |
| Unique flag names | 52 |
| Tests | 45 / 45 passing |

### Coverage Comparison vs Dub's Hand-Written CLI

| | Dub CLI (hand-written) | This PoC (auto-generated) |
|---|---|---|
| Commands | 2 (`shorten`, `links`) | 16 |
| Flags | 4 (`url`, `key`, `search`, `limit`) | 184 |
| API coverage | ~10% | ~95% |
| Deprecated field filtering | No | Yes |
| Type-aware flags | No | Yes (boolean, string, number, array, object) |

## Known Limitations

- **`LinksQuerySchema`** is defined as a `const` (not `export const`), so base fields for `links:list` and `links:count` are not fully resolved. These commands work but have fewer flags than ideal.
- **Nested object flags** (e.g., `--geo`) accept a JSON string — no sub-flag expansion yet.
- **Array flags** (e.g., `--tag-ids`) accept comma-separated strings — no repeated flag support.
- **No interactive mode** — all input is via flags (no prompts like Dub's existing CLI).
- **No response formatting** — output is raw JSON. A production CLI would add table formatting, colors, etc.

## Relevance to TOPIFY-160

This PoC validates the core hypothesis: **parsing a SaaS application's source code (Zod schemas + OpenAPI specs) can automatically generate a functional CLI** that covers significantly more API surface than a hand-written CLI.

Key technical findings:
1. Zod schemas are an excellent source of truth — they contain field names, types, descriptions, validation rules, and deprecation markers.
2. OpenAPI definitions provide the endpoint-to-schema mapping, HTTP methods, and paths.
3. The regex-based parser (no AST) is sufficient for a PoC and handles `z.object`, `.extend`, `.partial`, and nested definitions.
4. The generated CLI actually works — it builds correct HTTP requests that hit the real API.
