import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function unique(paths: string[]): string[] {
  return [...new Set(paths)];
}

export function parseEnvFile(contents: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const key = match[1];
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!value) continue;
    values[key] = value;
  }
  return values;
}

function applyEnvFile(file: string): void {
  const values = parseEnvFile(readFileSync(file, "utf8"));
  for (const [key, value] of Object.entries(values)) {
    if (!process.env[key]) process.env[key] = value;
  }
}

export function loadBackendEnv(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = unique([
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "env.local"),
    resolve(process.cwd(), "../../.env"),
    resolve(process.cwd(), "../../env.local"),
    resolve(here, "../../.env"),
    resolve(here, "../../env.local"),
    resolve(here, "../../../../.env"),
    resolve(here, "../../../../env.local"),
  ]);

  for (const file of candidates) {
    if (existsSync(file)) applyEnvFile(file);
  }
}
