#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# CLI-Anything Demo: Claude Agent using auto-generated CLI
#
# This demo shows how an AI agent can use a CLI (auto-generated
# from Dub.co's source code) to perform real operations on a
# running Dub instance — no hand-written API wrappers needed.
#
# PREREQUISITES:
#   - Dub running locally at http://localhost:8888
#   - DB seeded with demo workspace + API token
#
# USAGE: Run each block manually. This is a script to follow,
#        not to execute all at once.
# ═══════════════════════════════════════════════════════════════════

# ── Setup: export the API key ──
export DUB_API_KEY=dub_UOrbvO6CRJ_1FbgsUINs6bSM
cd poc-cli-gen

# ─────────────────────────────────────────────────────────────
# SCENE 1: "Agent, set up our marketing links"
#
# The agent receives a task: create a set of marketing links
# for a product launch. It uses the auto-generated CLI.
# ─────────────────────────────────────────────────────────────

# Agent discovers available commands
npx tsx generated/dub-cli.ts --help

# Agent checks what flags are available for creating links
npx tsx generated/dub-cli.ts links:create --help

# Agent creates the main product page link with UTM tracking
npx tsx generated/dub-cli.ts links:create \
  --url "https://myproduct.com/launch" \
  --key "launch" \
  --comments "Main launch page - created by Claude agent" \
  --utm_source "twitter" \
  --utm_medium "social" \
  --utm_campaign "product-launch-2026"

# Agent creates a link for the blog post announcement
npx tsx generated/dub-cli.ts links:create \
  --url "https://myproduct.com/blog/announcing-v2" \
  --key "blog-v2" \
  --comments "Blog announcement link" \
  --utm_source "newsletter" \
  --utm_medium "email" \
  --utm_campaign "product-launch-2026"

# Agent creates a password-protected link for press embargo
npx tsx generated/dub-cli.ts links:create \
  --url "https://myproduct.com/press-kit" \
  --key "press" \
  --password "embargo2026" \
  --comments "Press kit - password protected until launch day" \
  --expires-at "2026-04-01T00:00:00Z" \
  --expired-url "https://myproduct.com/press-kit-public"

# ─────────────────────────────────────────────────────────────
# SCENE 2: "Agent, verify everything was created"
#
# The agent lists all links to confirm they were created,
# then gets details on a specific one.
# ─────────────────────────────────────────────────────────────

# Agent lists all links in the workspace
npx tsx generated/dub-cli.ts links:list

# Agent gets link count
npx tsx generated/dub-cli.ts links:count

# Agent looks up the press link specifically
npx tsx generated/dub-cli.ts links:info --key "press" --domain "dub.sh"

# ─────────────────────────────────────────────────────────────
# SCENE 3: "Agent, update the launch link — marketing changed
#           the landing page and wants iOS users redirected
#           to the App Store"
#
# Complex update: change URL + add platform-specific redirect
# ─────────────────────────────────────────────────────────────

# First, agent finds the link ID
# (In a real agent flow, it would parse the JSON output)
LINK_ID=$(npx tsx generated/dub-cli.ts links:info --key "launch" --domain "dub.sh" 2>/dev/null | node -e "
  let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>console.log(JSON.parse(d).id))
")
echo "Found link ID: $LINK_ID"

# Agent updates the link with new URL and iOS redirect
npx tsx generated/dub-cli.ts links:update \
  --url "https://myproduct.com/launch-v2" \
  --ios "https://apps.apple.com/app/myproduct/id123456789" \
  --android "https://play.google.com/store/apps/details?id=com.myproduct"

# ─────────────────────────────────────────────────────────────
# SCENE 4: "Agent, create links for our partner campaign"
#
# Agent creates links with external IDs (for syncing with
# external systems) and custom OG previews
# ─────────────────────────────────────────────────────────────

# Agent creates a link with custom social preview (proxy mode)
npx tsx generated/dub-cli.ts links:create \
  --url "https://myproduct.com/partner/acme" \
  --key "acme-partner" \
  --proxy \
  --title "Exclusive: ACME Corp x MyProduct" \
  --description "Special offer for ACME Corp customers - 30% off" \
  --external-id "partner-acme-001" \
  --comments "Partner link for ACME Corp campaign"

# Agent uses upsert for idempotent link creation
# (safe to run multiple times — won't duplicate)
npx tsx generated/dub-cli.ts links:upsert \
  --url "https://myproduct.com/partner/globex" \
  --key "globex-partner" \
  --external-id "partner-globex-002" \
  --comments "Partner link for Globex campaign"

# ─────────────────────────────────────────────────────────────
# SCENE 5: "Agent, clean up the expired press link"
#
# Agent archives and then deletes links
# ─────────────────────────────────────────────────────────────

# Agent archives the press link
PRESS_ID=$(npx tsx generated/dub-cli.ts links:info --key "press" --domain "dub.sh" 2>/dev/null | node -e "
  let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>console.log(JSON.parse(d).id))
")

npx tsx generated/dub-cli.ts links:delete --link-id "$PRESS_ID"

# ─────────────────────────────────────────────────────────────
# SCENE 6: Show what's visible in the frontend
#
# Open the browser to show the links created by the agent
# are visible in the Dub dashboard
# ─────────────────────────────────────────────────────────────

# Final state: list all remaining links
npx tsx generated/dub-cli.ts links:list

# Open the Dub dashboard in the browser
# (The links the agent just created should be visible here)
open "http://localhost:8888"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Demo complete!"
echo ""
echo "  The Claude agent just performed 9 operations using"
echo "  a CLI that was 100% auto-generated from source code:"
echo ""
echo "    - Created 5 links (with UTM, passwords, OG previews)"
echo "    - Listed & counted links"
echo "    - Updated a link (new URL + iOS/Android redirects)"
echo "    - Deleted a link"
echo ""
echo "  All visible in the Dub dashboard at localhost:8888"
echo "═══════════════════════════════════════════════════════════"
