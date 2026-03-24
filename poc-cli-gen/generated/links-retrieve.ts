// Auto-generated CLI command for: GET /links/info
// Source: getLinkInfo

import { Command } from "commander";

export const linksRetrieve = new Command()
  .command("links:retrieve")
  .description("Retrieve a link")
  .action(async (options) => {
    const response = await fetch(`${API_BASE}/links/info`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  });
