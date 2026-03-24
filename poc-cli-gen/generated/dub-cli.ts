// Auto-generated CLI for Dub.co — all 16 endpoints
import { Command } from "commander";

const API_BASE = process.env.DUB_API_BASE || "http://localhost:8888/api";
const token = process.env.DUB_API_KEY || "";

// Boolean flags that the API accepts — these are kept even when false (for explicit --no-X)
const booleanFields = new Set([
  "archived", "proxy", "rewrite", "doIndex", "trackConversion",
]);

// Strip undefined/empty values — keep explicit booleans so --no-archived works
const clean = (opts: Record<string, any>) =>
  Object.fromEntries(Object.entries(opts).filter(([k, v]) =>
    v !== undefined && v !== '' &&
    !(v === false && !booleanFields.has(k)) &&
    !(typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length === 0)
  ));

const program = new Command();
program.name("dub").description("Auto-generated CLI for Dub.co").version("0.1.0");

// ── links:create: Create a link ──
const linksCreate = program
  .command("links:create")
  .description("Create a link")
  .requiredOption("-u, --url <string>", "The destination URL of the short link.")
  .option("-d, --domain <string>", "--domain")
  .option("-k, --key <string>", "--key")
  .option("--key-length <number>", "--key-length")
  .option("-e, --external-id <string>", "--external-id")
  .option("-t, --tenant-id <string>", "--tenant-id")
  .option("-p, --program-id <string>", "The ID of the program the short link is associated with.")
  .option("--partner-id <string>", "The ID of the partner the short link is associated with.")
  .option("--prefix <string>", "--prefix")
  .option("--track-conversion", "--track-conversion")
  .option("-a, --archived", "--archived")
  .option("--tag-ids <array>", "The unique IDs of the tags assigned to the short link.")
  .option("--tag-names <array>", "--tag-names")
  .option("-f, --folder-id <string>", "The unique ID existing folder to assign the short link to.")
  .option("-c, --comments <string>", "The comments for the short link.")
  .option("--expires-at <string>", "The date and time when the short link will expire at.")
  .option("--expired-url <string>", "The URL to redirect to when the short link has expired.")
  .option("--password <string>", "--password")
  .option("--proxy", "--proxy")
  .option("--title <string>", "--title")
  .option("--description <string>", "--description")
  .option("-i, --image <string>", "--image")
  .option("-v, --video <string>", "--video")
  .option("-r, --rewrite", "--rewrite")
  .option("--ios <string>", "--ios")
  .option("--android <string>", "--android")
  .option("-g, --geo <object>", "--geo")
  .option("--do-index", "--do-index")
  .option("--utm_source <string>", "--utm_source")
  .option("--utm_medium <string>", "--utm_medium")
  .option("--utm_campaign <string>", "--utm_campaign")
  .option("--utm_term <string>", "--utm_term")
  .option("--utm_content <string>", "--utm_content")
  .option("--ref <string>", "--ref")
  .option("-w, --webhook-ids <array>", "--webhook-ids")
  .option("--test-variants <string>", "--test-variants")
  .option("--test-started-at <string>", "The date and time when the tests started.")
  .option("--test-completed-at <string>", "The date and time when the tests were or will be completed.")
  .action(async (options) => {
    const res = await fetch(`${API_BASE}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(clean(options)),
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  });

// ── links:list: Retrieve a list of links ──
const linksList = program
  .command("links:list")
  .description("Retrieve a list of links")
  .option("-s, --sort-order <string>", "The sort order. The default is `desc`.")
  .action(async (options) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(options)) {
      if (v !== undefined) params.set(k, String(v));
    }
    const url = `${API_BASE}/links` + "?" + params.toString();
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  });

// ── links:count: Retrieve links count ──
const linksCount = program
  .command("links:count")
  .description("Retrieve links count")
  .option("-g, --group-by <string>", "The field to group the links by.")
  .action(async (options) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(options)) {
      if (v !== undefined) params.set(k, String(v));
    }
    const url = `${API_BASE}/links/count` + "?" + params.toString();
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  });

// ── links:info: Retrieve a link ──
const linksInfo = program
  .command("links:info")
  .description("Retrieve a link")
  .option("-d, --domain <string>", "--domain")
  .option("-k, --key <string>", "--key")
  .option("-l, --link-id <string>", "The unique ID of the short link.")
  .option("-e, --external-id <string>", "This is the ID of the link in the your database.")
  .action(async (options) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(options)) {
      if (v !== undefined) params.set(k, String(v));
    }
    const url = `${API_BASE}/links/info` + "?" + params.toString();
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  });

// ── links:update: Update a link ──
const linksUpdate = program
  .command("links:update")
  .description("Update a link")
  .requiredOption("-l, --link-id <string>", "The unique ID of the link to update.")
  .option("-u, --url <string>", "The destination URL of the short link.")
  .option("-d, --domain <string>", "--domain")
  .option("-k, --key <string>", "--key")
  .option("--key-length <number>", "--key-length")
  .option("-e, --external-id <string>", "--external-id")
  .option("-t, --tenant-id <string>", "--tenant-id")
  .option("-p, --program-id <string>", "The ID of the program the short link is associated with.")
  .option("--partner-id <string>", "The ID of the partner the short link is associated with.")
  .option("--prefix <string>", "--prefix")
  .option("--track-conversion", "--track-conversion")
  .option("-a, --archived", "--archived")
  .option("--tag-ids <array>", "The unique IDs of the tags assigned to the short link.")
  .option("--tag-names <array>", "--tag-names")
  .option("-f, --folder-id <string>", "The unique ID existing folder to assign the short link to.")
  .option("-c, --comments <string>", "The comments for the short link.")
  .option("--expires-at <string>", "The date and time when the short link will expire at.")
  .option("--expired-url <string>", "The URL to redirect to when the short link has expired.")
  .option("--password <string>", "--password")
  .option("--proxy", "--proxy")
  .option("--title <string>", "--title")
  .option("--description <string>", "--description")
  .option("-i, --image <string>", "--image")
  .option("-v, --video <string>", "--video")
  .option("-r, --rewrite", "--rewrite")
  .option("--ios <string>", "--ios")
  .option("--android <string>", "--android")
  .option("-g, --geo <object>", "--geo")
  .option("--do-index", "--do-index")
  .option("--utm_source <string>", "--utm_source")
  .option("--utm_medium <string>", "--utm_medium")
  .option("--utm_campaign <string>", "--utm_campaign")
  .option("--utm_term <string>", "--utm_term")
  .option("--utm_content <string>", "--utm_content")
  .option("--ref <string>", "--ref")
  .option("-w, --webhook-ids <array>", "--webhook-ids")
  .option("--test-variants <string>", "--test-variants")
  .option("--test-started-at <string>", "The date and time when the tests started.")
  .option("--test-completed-at <string>", "The date and time when the tests were or will be completed.")
  .action(async (options) => {
    const { linkId, ...body } = options;
    const res = await fetch(`${API_BASE}/links/${linkId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(clean(body)),
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  });

// ── links:delete: Delete a link ──
const linksDelete = program
  .command("links:delete")
  .description("Delete a link")
  .requiredOption("-l, --link-id <string>", "The unique ID of the link.")
  .action(async (options) => {
    const res = await fetch(`${API_BASE}/links/${options.linkId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  });

// ── links:bulk-create: Bulk create links ──
const linksBulkCreate = program
  .command("links:bulk-create")
  .description("Bulk create links")
  .requiredOption("-u, --url <string>", "The destination URL of the short link.")
  .option("-d, --domain <string>", "--domain")
  .option("-k, --key <string>", "--key")
  .option("--key-length <number>", "--key-length")
  .option("-e, --external-id <string>", "--external-id")
  .option("-t, --tenant-id <string>", "--tenant-id")
  .option("-p, --program-id <string>", "The ID of the program the short link is associated with.")
  .option("--partner-id <string>", "The ID of the partner the short link is associated with.")
  .option("--prefix <string>", "--prefix")
  .option("--track-conversion", "--track-conversion")
  .option("-a, --archived", "--archived")
  .option("--tag-ids <array>", "The unique IDs of the tags assigned to the short link.")
  .option("--tag-names <array>", "--tag-names")
  .option("-f, --folder-id <string>", "The unique ID existing folder to assign the short link to.")
  .option("-c, --comments <string>", "The comments for the short link.")
  .option("--expires-at <string>", "The date and time when the short link will expire at.")
  .option("--expired-url <string>", "The URL to redirect to when the short link has expired.")
  .option("--password <string>", "--password")
  .option("--proxy", "--proxy")
  .option("--title <string>", "--title")
  .option("--description <string>", "--description")
  .option("-i, --image <string>", "--image")
  .option("-v, --video <string>", "--video")
  .option("-r, --rewrite", "--rewrite")
  .option("--ios <string>", "--ios")
  .option("--android <string>", "--android")
  .option("-g, --geo <object>", "--geo")
  .option("--do-index", "--do-index")
  .option("--utm_source <string>", "--utm_source")
  .option("--utm_medium <string>", "--utm_medium")
  .option("--utm_campaign <string>", "--utm_campaign")
  .option("--utm_term <string>", "--utm_term")
  .option("--utm_content <string>", "--utm_content")
  .option("--ref <string>", "--ref")
  .option("-w, --webhook-ids <array>", "--webhook-ids")
  .option("--test-variants <string>", "--test-variants")
  .option("--test-started-at <string>", "The date and time when the tests started.")
  .option("--test-completed-at <string>", "The date and time when the tests were or will be completed.")
  .action(async (options) => {
    const res = await fetch(`${API_BASE}/links/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(clean(options)),
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  });

// ── links:bulk-update: Bulk update links ──
const linksBulkUpdate = program
  .command("links:bulk-update")
  .description("Bulk update links")
  .requiredOption("-l, --link-ids <array>", "--link-ids")
  .requiredOption("-e, --external-ids <array>", "--external-ids")
  .option("-d, --data <string>", "The destination URL of the short link.")
  .action(async (options) => {
    const res = await fetch(`${API_BASE}/links/bulk`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(clean(options)),
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  });

// ── links:bulk-delete: Bulk delete links ──
const linksBulkDelete = program
  .command("links:bulk-delete")
  .description("Bulk delete links")
  .requiredOption("-l, --link-ids <array>", "Comma-separated link IDs to delete.")
  .action(async (options) => {
    const res = await fetch(`${API_BASE}/links/bulk`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  });

// ── links:upsert: Upsert a link ──
const linksUpsert = program
  .command("links:upsert")
  .description("Upsert a link")
  .requiredOption("-u, --url <string>", "The destination URL of the short link.")
  .option("-d, --domain <string>", "--domain")
  .option("-k, --key <string>", "--key")
  .option("--key-length <number>", "--key-length")
  .option("-e, --external-id <string>", "--external-id")
  .option("-t, --tenant-id <string>", "--tenant-id")
  .option("-p, --program-id <string>", "The ID of the program the short link is associated with.")
  .option("--partner-id <string>", "The ID of the partner the short link is associated with.")
  .option("--prefix <string>", "--prefix")
  .option("--track-conversion", "--track-conversion")
  .option("-a, --archived", "--archived")
  .option("--tag-ids <array>", "The unique IDs of the tags assigned to the short link.")
  .option("--tag-names <array>", "--tag-names")
  .option("-f, --folder-id <string>", "The unique ID existing folder to assign the short link to.")
  .option("-c, --comments <string>", "The comments for the short link.")
  .option("--expires-at <string>", "The date and time when the short link will expire at.")
  .option("--expired-url <string>", "The URL to redirect to when the short link has expired.")
  .option("--password <string>", "--password")
  .option("--proxy", "--proxy")
  .option("--title <string>", "--title")
  .option("--description <string>", "--description")
  .option("-i, --image <string>", "--image")
  .option("-v, --video <string>", "--video")
  .option("-r, --rewrite", "--rewrite")
  .option("--ios <string>", "--ios")
  .option("--android <string>", "--android")
  .option("-g, --geo <object>", "--geo")
  .option("--do-index", "--do-index")
  .option("--utm_source <string>", "--utm_source")
  .option("--utm_medium <string>", "--utm_medium")
  .option("--utm_campaign <string>", "--utm_campaign")
  .option("--utm_term <string>", "--utm_term")
  .option("--utm_content <string>", "--utm_content")
  .option("--ref <string>", "--ref")
  .option("-w, --webhook-ids <array>", "--webhook-ids")
  .option("--test-variants <string>", "--test-variants")
  .option("--test-started-at <string>", "The date and time when the tests started.")
  .option("--test-completed-at <string>", "The date and time when the tests were or will be completed.")
  .action(async (options) => {
    const res = await fetch(`${API_BASE}/links/upsert`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(clean(options)),
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  });

// ── domains:create: Create a domain ──
const domainsCreate = program
  .command("domains:create")
  .description("Create a domain")
  .requiredOption("-s, --slug <string>", "Name of the domain.")
  .option("-e, --expired-url <string>", "--expired-url")
  .option("-n, --not-found-url <string>", "--not-found-url")
  .option("-a, --archived", "--archived")
  .option("-p, --placeholder <string>", "--placeholder")
  .option("-l, --logo <string>", "The logo of the domain.")
  .option("--asset-links <string>", "--asset-links")
  .option("--apple-app-site-association <string>", "--apple-app-site-association")
  .action(async (options) => {
    const res = await fetch(`${API_BASE}/domains`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(clean(options)),
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  });

// ── domains:list: Retrieve a list of domains ──
const domainsList = program
  .command("domains:list")
  .description("Retrieve a list of domains")
  .option("-a, --archived <string>", "--archived")
  .option("-s, --search <string>", "The search term to filter the domains by.")
  .action(async (options) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(options)) {
      if (v !== undefined) params.set(k, String(v));
    }
    const url = `${API_BASE}/domains` + "?" + params.toString();
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  });

// ── domains:update: Update a domain ──
const domainsUpdate = program
  .command("domains:update")
  .description("Update a domain")
  .option("-s, --slug <string>", "Name of the domain.")
  .option("-e, --expired-url <string>", "--expired-url")
  .option("-n, --not-found-url <string>", "--not-found-url")
  .option("-a, --archived", "--archived")
  .option("-p, --placeholder <string>", "--placeholder")
  .option("-l, --logo <string>", "The logo of the domain.")
  .option("--asset-links <string>", "--asset-links")
  .option("--apple-app-site-association <string>", "--apple-app-site-association")
  .action(async (options) => {
    const res = await fetch(`${API_BASE}/domains/${options.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(clean(options)),
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  });

// ── domains:delete: Delete a domain ──
const domainsDelete = program
  .command("domains:delete")
  .description("Delete a domain")
  .requiredOption("-s, --slug <string>", "The domain slug.")
  .action(async (options) => {
    const res = await fetch(`${API_BASE}/domains/${options.slug}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  });

// ── domains:register: Register a domain ──
const domainsRegister = program
  .command("domains:register")
  .description("Register a domain")
  .requiredOption("-d, --domain <string>", "The domain to claim. We only support .link domains for now.")
  .action(async (options) => {
    const res = await fetch(`${API_BASE}/domains/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(clean(options)),
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  });

// ── domains:check-status: Check the availability of one or more domains ──
const domainsCheckStatus = program
  .command("domains:check-status")
  .description("Check the availability of one or more domains")
  .requiredOption("-d, --domains <array>", "The domains to search. We only support .link domains for now.")
  .action(async (options) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(options)) {
      if (v !== undefined) params.set(k, String(v));
    }
    const url = `${API_BASE}/domains/status` + "?" + params.toString();
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  });

program.parse();