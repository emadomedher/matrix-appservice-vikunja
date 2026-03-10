/** Configuration schema and validation */

export interface BridgeConfig {
  homeserver: {
    url: string;
    domain: string;
  };
  appservice: {
    port: number;
    bindAddress: string;
  };
  vikunja: {
    url: string;
    apiToken: string;
  };
  webhook: {
    port: number;
    secret: string;
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
  };
}

export function validateConfig(config: unknown): BridgeConfig {
  if (!config || typeof config !== "object") {
    throw new Error("Config must be a non-null object");
  }

  const c = config as Record<string, unknown>;

  // Validate homeserver
  const hs = c.homeserver as Record<string, unknown> | undefined;
  if (!hs || typeof hs.url !== "string" || typeof hs.domain !== "string") {
    throw new Error("Config: homeserver.url and homeserver.domain are required strings");
  }

  // Validate appservice
  const as_ = c.appservice as Record<string, unknown> | undefined;
  if (!as_ || typeof as_.port !== "number") {
    throw new Error("Config: appservice.port is required and must be a number");
  }

  // Validate vikunja
  const vk = c.vikunja as Record<string, unknown> | undefined;
  if (!vk || typeof vk.url !== "string" || typeof vk.apiToken !== "string") {
    throw new Error("Config: vikunja.url and vikunja.apiToken are required strings");
  }

  // Validate webhook
  const wh = c.webhook as Record<string, unknown> | undefined;
  if (!wh || typeof wh.port !== "number" || typeof wh.secret !== "string") {
    throw new Error("Config: webhook.port (number) and webhook.secret (string) are required");
  }

  // Build validated config with defaults
  const logging = c.logging as Record<string, unknown> | undefined;
  const level = (logging?.level as string) || "info";
  if (!["debug", "info", "warn", "error"].includes(level)) {
    throw new Error(`Config: logging.level must be one of: debug, info, warn, error`);
  }

  return {
    homeserver: {
      url: hs.url as string,
      domain: hs.domain as string,
    },
    appservice: {
      port: as_.port as number,
      bindAddress: (as_.bindAddress as string) || "0.0.0.0",
    },
    vikunja: {
      url: vk.url as string,
      apiToken: vk.apiToken as string,
    },
    webhook: {
      port: wh.port as number,
      secret: wh.secret as string,
    },
    logging: {
      level: level as BridgeConfig["logging"]["level"],
    },
  };
}
