import fs from "fs";
import path from "path";
import yaml from "js-yaml";

interface PasswordConfig {
  enabled: boolean;
  value: string;
  message?: string;
}

interface Config {
  password: PasswordConfig;
}

let configCache: Config | null = null;

export function getConfig(): Config {
  if (configCache) {
    return configCache;
  }

  try {
    const configPath = path.join(process.cwd(), "config.yaml");
    const fileContents = fs.readFileSync(configPath, "utf8");
    configCache = yaml.load(fileContents) as Config;
    return configCache!;
  } catch {
    // Default config if file doesn't exist
    console.warn("config.yaml not found, using default config");
    return {
      password: {
        enabled: false,
        value: "",
        message: "Enter password to access the lectures",
      },
    };
  }
}

export function getPasswordConfig(): PasswordConfig {
  const config = getConfig();
  return config.password;
}
