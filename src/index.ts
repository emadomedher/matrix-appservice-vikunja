import express from "express";
import { loadConfig } from "./config.js";
import { VikunjaBridge } from "./bridge.js";
import { createWebhookRouter } from "./vikunja/webhooks.js";

const LOG_PREFIX = "[Main]";

async function main() {
  const configPath = process.argv[2] ?? "config.yaml";
  const registrationPath = process.argv[3] ?? "vikunja-registration.yaml";

  console.log(LOG_PREFIX, `Loading config from ${configPath}`);
  const config = loadConfig(configPath);

  console.log(LOG_PREFIX, "Starting Vikunja-Matrix bridge...");

  // Start the Matrix appservice bridge
  const bridge = new VikunjaBridge(config, registrationPath);
  await bridge.start();

  // Start the webhook receiver
  const webhookApp = express();
  const webhookRouter = createWebhookRouter({
    secret: config.webhook.secret,
    sendToProject: (projectId, content) => bridge.sendToProject(projectId, content),
  });

  webhookApp.use(webhookRouter);

  // Health check endpoint
  webhookApp.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "matrix-appservice-vikunja" });
  });

  webhookApp.listen(config.webhook.port, () => {
    console.log(LOG_PREFIX, `Webhook server listening on port ${config.webhook.port}`);
  });

  console.log(LOG_PREFIX, "Bridge is running.");
}

main().catch((err) => {
  console.error(LOG_PREFIX, "Fatal error:", err);
  process.exit(1);
});
