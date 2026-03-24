// Auto-generated CLI command for: PUT /links/upsert
// Source: upsertLink

import { Command } from "commander";

export const linksUpsert = new Command()
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
    const response = await fetch(`${API_BASE}/links/upsert`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(options),
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  });
