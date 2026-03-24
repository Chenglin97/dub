// Auto-generated CLI command for: GET /domains
// Source: listDomains

import { Command } from "commander";

export const domainsRetrieve = new Command()
  .command("domains:retrieve")
  .description("Retrieve a list of domains")
  .action(async (options) => {
    const response = await fetch(`${API_BASE}/domains`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  });
