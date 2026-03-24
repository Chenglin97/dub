// Auto-generated CLI command for: DELETE /links/{linkId}
// Source: deleteLink

import { Command } from "commander";

export const linksDelete = new Command()
  .command("links:delete")
  .description("Delete a link")
  .requiredOption("-l, --link-id <string>", "The unique ID of the link.")
  .action(async (options) => {
    const response = await fetch(`${API_BASE}/links/{linkId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  });
