#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# CLI-Anything Demo Script
# Record this with a terminal recorder (e.g., asciinema, OBS, etc.)
#
# USAGE: Run each section manually, one block at a time.
#        This file is a guide — don't run it all at once.
# ═══════════════════════════════════════════════════════════════════

# ── Prep: clear terminal, set a nice prompt ──
# export PS1="\[\e[36m\]demo $\[\e[0m\] "
# clear

# ─────────────────────────────────────────────────────────────
# PART 1: Show the problem — Dub's hand-written CLI is limited
# ─────────────────────────────────────────────────────────────

# "Let's look at Dub.co's existing CLI — what did they write by hand?"

cat packages/cli/src/commands/shorten.ts
# Point out: only takes `url` and `key` — 2 arguments, no flags

cat packages/cli/src/commands/links.ts
# Point out: only `--search` and `--limit` — 2 flags total

cat packages/cli/src/commands/domains.ts
# Point out: interactive only, no flags at all

# "That's it. 2 commands, 4 parameters. The API has 16 endpoints
#  with 50+ fields. 90% of the API is unreachable from the CLI."

# ─────────────────────────────────────────────────────────────
# PART 2: Show what we're parsing — the Zod schemas
# ─────────────────────────────────────────────────────────────

# "But the source code already has everything we need —
#  Zod schemas with types, descriptions, validation, deprecation markers."

head -80 apps/web/lib/zod/schemas/links.ts
# Point out: z.object, .describe(), .optional(), .meta({ deprecated: true })

# "And OpenAPI definitions that map endpoints to schemas."

cat apps/web/lib/openapi/links/index.ts
# Point out: path -> method -> operationId mapping

# ─────────────────────────────────────────────────────────────
# PART 3: Run the generator
# ─────────────────────────────────────────────────────────────

# "So let's auto-generate a CLI from this source code."

cd poc-cli-gen
npx tsx parse-schema-to-cli.ts

# Let the output scroll — it shows:
#   - Schemas parsed with field counts
#   - Endpoints discovered
#   - Commands generated with flag counts
#   - Coverage comparison table
#   - Final summary

# ─────────────────────────────────────────────────────────────
# PART 4: Show the generated CLI
# ─────────────────────────────────────────────────────────────

# "Now let's see what we generated."

npx tsx generated/dub-cli.ts --help
# Point out: 16 commands vs the original 2

npx tsx generated/dub-cli.ts links:create --help
# Point out: 32 flags — url, domain, key, geo, utm params, webhooks, etc.

npx tsx generated/dub-cli.ts domains:create --help
# Point out: slug, expired-url, not-found-url, placeholder, logo, etc.

# ─────────────────────────────────────────────────────────────
# PART 5: Run the tests
# ─────────────────────────────────────────────────────────────

# "And all 45 tests pass."

npx tsx test-generated-cli.ts

# ─────────────────────────────────────────────────────────────
# PART 6: (Optional) Actually call the API
# ─────────────────────────────────────────────────────────────

# If you have a DUB_API_KEY set up:

# export DUB_API_KEY=your_key_here

# npx tsx generated/dub-cli.ts links:create \
#   --url "https://example.com/demo" \
#   --key "cli-demo"

# npx tsx generated/dub-cli.ts links:list

# npx tsx generated/dub-cli.ts domains:list
