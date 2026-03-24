// Auto-generated CLI command for: GET /domains/status
// Source: checkDomainStatus

import { Command } from "commander";

export const domainsCheckStatus = new Command()
  .command("domains:check-status")
  .description("Check the availability of one or more domains")
  .requiredOption("-d, --domains <array>", "The domains to search. We only support .link domains for now.")
  .action(async (options) => {
    const response = await fetch(`${API_BASE}/domains/status`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  });
