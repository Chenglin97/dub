// Auto-generated CLI command for: GET /links
// Source: getLinks

import { Command } from "commander";

export const linksList = new Command()
  .command("links:list")
  .description("Retrieve a list of links")
  .option("-s, --sort-order <string>", "The sort order. The default is `desc`.")
  .action(async (options) => {
    const response = await fetch(`${API_BASE}/links`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  });
