// Auto-generated CLI command for: DELETE /domains/{slug}
// Source: deleteDomain

import { Command } from "commander";

export const domainsDelete = new Command()
  .command("domains:delete")
  .description("Delete a domain")
  .requiredOption("-s, --slug <string>", "The domain slug.")
  .action(async (options) => {
    const response = await fetch(`${API_BASE}/domains/{slug}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  });
