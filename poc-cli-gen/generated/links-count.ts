// Auto-generated CLI command for: GET /links/count
// Source: getLinksCount

import { Command } from "commander";

export const linksCount = new Command()
  .command("links:count")
  .description("Retrieve links count")
  .option("-g, --group-by <string>", "The field to group the links by.")
  .action(async (options) => {
    const response = await fetch(`${API_BASE}/links/count`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  });
