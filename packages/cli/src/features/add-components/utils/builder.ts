import { z } from "zod";
import { REGISTRY_URL } from "./constants";
import { expandEnvVars } from "./env";
import { parseRegistryAndItemFromString } from "./parser";
import { isUrl } from "./helpers";
import { registryConfigItemSchema } from "config/schema";
import { Config } from "utils/get-config";
import { RegistryNotConfiguredError } from "../utils/errors";
import { validateRegistryConfig } from "./validator";

const NAME_PLACEHOLDER = "{name}";
const ENV_VAR_PATTERN = /\${(\w+)}/g;
const QUERY_PARAM_SEPARATOR = "?";
const QUERY_PARAM_DELIMITER = "&";

export function buildUrlAndHeadersForRegistryItem(name: string, config?: Config) {
  const { registry, item } = parseRegistryAndItemFromString(name);

  if (!registry) {
    return null;
  }

  const registries = config?.registries || {};
  const registryConfig = registries[registry];
  if (!registryConfig) {
    throw new RegistryNotConfiguredError(registry);
  }

  // TODO: I don't like this here.
  // But this will do for now.
  validateRegistryConfig(registry, registryConfig);

  return {
    url: buildUrlFromRegistryConfig(item, registryConfig),
    headers: buildHeadersFromRegistryConfig(registryConfig),
  };
}

export function buildUrlFromRegistryConfig(item: string, registryConfig: z.infer<typeof registryConfigItemSchema>) {
  if (typeof registryConfig === "string") {
    let url = registryConfig.replace(NAME_PLACEHOLDER, item);
    return expandEnvVars(url);
  }

  let baseUrl = registryConfig.url.replace(NAME_PLACEHOLDER, item);
  baseUrl = expandEnvVars(baseUrl);

  if (!registryConfig.params) {
    return baseUrl;
  }

  return appendQueryParams(baseUrl, registryConfig.params);
}

export function buildHeadersFromRegistryConfig(config: z.infer<typeof registryConfigItemSchema>) {
  if (typeof config === "string" || !config.headers) {
    return {};
  }

  const headers: Record<string, string> = {};

  for (const [key, value] of Object.entries(config.headers)) {
    const expandedValue = expandEnvVars(value);

    if (shouldIncludeHeader(value, expandedValue)) {
      headers[key] = expandedValue;
    }
  }

  return headers;
}

function appendQueryParams(baseUrl: string, params: Record<string, string>) {
  const urlParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    const expandedValue = expandEnvVars(value);
    if (expandedValue) {
      urlParams.append(key, expandedValue);
    }
  }

  const queryString = urlParams.toString();
  if (!queryString) {
    return baseUrl;
  }

  const separator = baseUrl.includes(QUERY_PARAM_SEPARATOR) ? QUERY_PARAM_DELIMITER : QUERY_PARAM_SEPARATOR;

  return `${baseUrl}${separator}${queryString}`;
}

function shouldIncludeHeader(originalValue: string, expandedValue: string) {
  const trimmedExpanded = expandedValue.trim();

  if (!trimmedExpanded) {
    return false;
  }

  // If the original value contains valid env vars, only include if expansion changed the value.
  if (originalValue.includes("${")) {
    // Check if there are actual env vars in the string
    const envVars = originalValue.match(ENV_VAR_PATTERN);
    if (envVars) {
      const templateWithoutVars = originalValue.replace(ENV_VAR_PATTERN, "").trim();
      return trimmedExpanded !== templateWithoutVars;
    }
  }

  return true;
}

/**
 * Resolves a registry URL from a path or URL string.
 * Handles special cases like v0 registry URLs that need /json suffix.
 *
 * @param pathOrUrl - Either a relative path or a full URL
 * @returns The resolved registry URL
 */
export function resolveRegistryUrl(pathOrUrl: string) {
  if (isUrl(pathOrUrl)) {
    // If the url contains /chat/b/, we assume it's the v0 registry.
    // We need to add the /json suffix if it's missing.
    const url = new URL(pathOrUrl);
    if (url.pathname.match(/\/chat\/b\//) && !url.pathname.endsWith("/json")) {
      url.pathname = `${url.pathname}/json`;
    }

    return url.toString();
  }

  return `${REGISTRY_URL}/${pathOrUrl}`;
}
