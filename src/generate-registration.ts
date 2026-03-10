import { writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { stringify } from "yaml";

/**
 * CLI to generate a Synapse-compatible appservice registration YAML.
 *
 * Usage: node dist/generate-registration.js [--domain example.com] [--output vikunja-registration.yaml]
 */

function main() {
  const args = process.argv.slice(2);
  let domain = "example.com";
  let output = "vikunja-registration.yaml";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--domain" && args[i + 1]) {
      domain = args[i + 1];
      i++;
    } else if (args[i] === "--output" && args[i + 1]) {
      output = args[i + 1];
      i++;
    }
  }

  const asToken = randomUUID();
  const hsToken = randomUUID();

  const registration = {
    id: "vikunja-bridge",
    hs_token: hsToken,
    as_token: asToken,
    url: "http://localhost:9500",
    sender_localpart: "vikunjabot",
    namespaces: {
      users: [
        {
          exclusive: true,
          regex: `@vikunja_.*:${escapeRegex(domain)}`,
        },
      ],
      aliases: [
        {
          exclusive: true,
          regex: `#vikunja_.*:${escapeRegex(domain)}`,
        },
      ],
      rooms: [],
    },
    rate_limited: false,
  };

  const yaml = stringify(registration);
  writeFileSync(output, yaml, "utf-8");
  console.log(`Registration file written to: ${output}`);
  console.log(`AS Token: ${asToken}`);
  console.log(`HS Token: ${hsToken}`);
  console.log(`\nAdd this to your Synapse homeserver.yaml:`);
  console.log(`  app_service_config_files:`);
  console.log(`    - /path/to/${output}`);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

main();
