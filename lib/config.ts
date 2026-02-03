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

  // Check environment variables first (for Vercel/production)
  const envPasswordEnabled = process.env.PASSWORD_ENABLED;
  const envPasswordValue = process.env.PASSWORD_VALUE;
  const envPasswordMessage = process.env.PASSWORD_MESSAGE;

  if (envPasswordEnabled !== undefined || envPasswordValue) {
    configCache = {
      password: {
        enabled: envPasswordEnabled === "true" || envPasswordEnabled === "1",
        value: envPasswordValue || "",
        message: envPasswordMessage || "Enter password to access the lectures",
      },
    };
    return configCache;
  }

  // Fallback to config.yaml file (for local development)
  try {
    const configPath = path.join(process.cwd(), "config.yaml");
    const fileContents = fs.readFileSync(configPath, "utf8");
    configCache = yaml.load(fileContents) as Config;
    return configCache!;
  } catch {
    // Default config if file doesn't exist
    console.warn("config.yaml not found and no env vars set, using default config");
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
