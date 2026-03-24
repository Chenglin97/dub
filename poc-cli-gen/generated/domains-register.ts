// Auto-generated CLI command for: POST /domains/register
// Source: registerDomain

import { Command } from "commander";

export const domainsRegister = new Command()
  .command("domains:register")
  .description("Register a domain")
  .requiredOption("-d, --domain <string>", "The domain to claim. We only support .link domains for now.")
  .action(async (options) => {
    const response = await fetch(`${API_BASE}/domains/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(options),
    });
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  });
