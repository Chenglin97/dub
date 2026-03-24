# Demo Prompts — type these into Claude Code

## Before recording
- Have the Dub dashboard open at http://localhost:8888
- Clean slate: `docker exec web-ps-mysql-1 mysql -u root planetscale -e "DELETE FROM Link WHERE projectId = 'ws_demo_001';"`
- Refresh dashboard to show empty state

---

## Prompt 1: Discovery
"What CLI commands do I have available for managing Dub links?"

## Prompt 2: Create a campaign (multiple links)
"Create a marketing campaign for our product launch. I need:
- A main launch page link pointing to https://myproduct.com/launch with UTM tracking for twitter
- A blog link pointing to https://myproduct.com/blog/v2-announcement for our newsletter
- A press kit link pointing to https://myproduct.com/press-kit that's password protected with 'embargo2026' and expires on April 1st 2026"

> (Refresh dashboard after — show 3 new links appeared)

## Prompt 3: Query & inspect
"How many links do we have? Show me the details of the press link"

## Prompt 4: Complex update
"Marketing changed their mind — update the launch link to point to https://myproduct.com/launch-v2 instead, and add iOS redirect to https://apps.apple.com/app/myproduct/id123 and Android redirect to https://play.google.com/store/apps/details?id=com.myproduct"

> (Refresh dashboard — show the link URL changed)

## Prompt 5: Cleanup
"The press embargo is over, delete the press kit link"

> (Refresh dashboard — link gone)

## Prompt 6: (Optional) Upsert for idempotency
"Create a partner link for ACME Corp pointing to https://myproduct.com/partners/acme with external ID partner-acme-001. Use upsert so it's safe to run again"
