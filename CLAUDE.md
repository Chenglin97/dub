# Dub.co CLI (Auto-Generated)

This repo has an auto-generated CLI for managing Dub.co short links and domains.

## CLI Location & Usage

```bash
cd poc-cli-gen
DUB_API_KEY=dub_UOrbvO6CRJ_1FbgsUINs6bSM npx tsx generated/dub-cli.ts <command> [options]
```

The API base is `http://localhost:8888/api` (local Dub instance).

## Available Commands

| Command | Description |
|---------|-------------|
| `links:create` | Create a short link |
| `links:list` | List all links |
| `links:count` | Get link count |
| `links:info` | Get link details (use `--key` and `--domain dub.sh`) |
| `links:update` | Update a link (requires `--link-id`) |
| `links:delete` | Delete a link (requires `--link-id`) |
| `links:upsert` | Create or update by external ID |
| `links:bulk-create` | Bulk create links |
| `links:bulk-update` | Bulk update links |
| `links:bulk-delete` | Bulk delete links |
| `domains:create` | Create a domain |
| `domains:list` | List domains |
| `domains:update` | Update a domain |
| `domains:delete` | Delete a domain |

## Key Flags for links:create

- `--url` (required) — destination URL
- `--key` — custom short link slug
- `--domain` — domain (default: dub.sh)
- `--comments` — internal notes
- `--utm_source`, `--utm_medium`, `--utm_campaign`, `--utm_term`, `--utm_content` — UTM params
- `--password` — password protect
- `--expires-at` — expiration datetime (ISO 8601)
- `--expired-url` — redirect after expiry
- `--ios` — iOS-specific redirect URL
- `--android` — Android-specific redirect URL
- `--proxy` — enable custom OG preview
- `--title`, `--description`, `--image` — custom OG meta (requires --proxy)
- `--external-id` — external system ID
- `--archived` — archive the link
- `--tag-ids` — comma-separated tag IDs
- `--rewrite` — URL cloaking

## Workflow Tips

- To get a link ID: use `links:info --key <key> --domain dub.sh` and parse the `id` field from JSON output
- To update/delete: you need the link ID from above
- All output is JSON
- The Dub dashboard at http://localhost:8888 shows changes in real-time (refresh to see)
