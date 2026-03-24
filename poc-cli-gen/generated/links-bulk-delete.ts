// Auto-generated CLI command for: DELETE /links/bulk
// Source: bulkDeleteLinks

import { Command } from "commander";

export const linksBulkDelete = new Command()
  .command("links:bulk-delete")
  .description("Bulk delete links")
  .requiredOption("-l, --link-ids <array>", "Comma-separated link IDs to delete.")
  .action(async (options) => {
    const response = await fetch(`${API_BASE}/links/bulk`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  });
