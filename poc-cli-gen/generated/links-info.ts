// Auto-generated CLI command for: GET /links/info
// Source: getLinkInfo

import { Command } from "commander";

export const linksInfo = new Command()
  .command("links:info")
  .description("Retrieve a link")
  .option("-d, --domain <string>", "--domain")
  .option("-k, --key <string>", "--key")
  .option("-l, --link-id <string>", "The unique ID of the short link.")
  .option("-e, --external-id <string>", "This is the ID of the link in the your database.")
  .action(async (options) => {
    const response = await fetch(`${API_BASE}/links/info`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  });
