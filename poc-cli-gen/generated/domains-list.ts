// Auto-generated CLI command for: GET /domains
// Source: listDomains

import { Command } from "commander";

export const domainsList = new Command()
  .command("domains:list")
  .description("Retrieve a list of domains")
  .option("-a, --archived <string>", "--archived")
  .option("-s, --search <string>", "The search term to filter the domains by.")
  .action(async (options) => {
    const response = await fetch(`${API_BASE}/domains`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  });
