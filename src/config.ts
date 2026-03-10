import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { type BridgeConfig, validateConfig } from "./config/schema.js";

export type { BridgeConfig };

/**
 * Load and validate configuration from a YAML file.
 */
export function loadConfig(filePath: string): BridgeConfig {
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch (err) {
    throw new Error(`Failed to read config file '${filePath}': ${(err as Error).message}`);
  }

  let parsed: unknown;
  try {
    parsed = parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse config YAML: ${(err as Error).message}`);
  }

  return validateConfig(parsed);
}
