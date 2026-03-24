// Auto-generated CLI command for: POST /domains
// Source: createDomain

import { Command } from "commander";

export const domainsCreate = new Command()
  .command("domains:create")
  .description("Create a domain")
  .requiredOption("-s, --slug <string>", "Name of the domain.")
  .option("-e, --expired-url <string>", "--expired-url")
  .option("-n, --not-found-url <string>", "--not-found-url")
  .option("-a, --archived", "--archived")
  .option("-p, --placeholder <string>", "--placeholder")
  .option("-l, --logo <string>", "The logo of the domain.")
  .option("--asset-links <string>", "--asset-links")
  .option("--apple-app-site-association <string>", "--apple-app-site-association")
  .action(async (options) => {
    const response = await fetch(`${API_BASE}/domains`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(options),
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  });
