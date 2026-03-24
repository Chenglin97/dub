// Auto-generated CLI command for: PATCH /links/bulk
// Source: bulkUpdateLinks

import { Command } from "commander";

export const linksBulkUpdate = new Command()
  .command("links:bulk-update")
  .description("Bulk update links")
  .requiredOption("-l, --link-ids <array>", "--link-ids")
  .requiredOption("-e, --external-ids <array>", "--external-ids")
  .option("-d, --data <string>", "The destination URL of the short link.")
  .action(async (options) => {
    const response = await fetch(`${API_BASE}/links/bulk`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(options),
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  });
