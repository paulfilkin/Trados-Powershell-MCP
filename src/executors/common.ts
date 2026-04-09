// Escape a string for single-quoted PowerShell interpolation.
export function psStr(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

// Normalise path separators and escape for PS.
export function psPath(value: string): string {
  return psStr(value.replace(/\//g, "\\"));
}

// Extract the error message from PS stderr JSON or raw text.
export function extractPsError(stderr: string): string {
  try {
    const parsed = JSON.parse(stderr.trim()) as { error?: string };
    return parsed.error ?? stderr.trim();
  } catch {
    return stderr.trim();
  }
}

/**
 * Build a PowerShell expression that deserialises a JSON string parameter
 * into a hashtable (or array of hashtables) suitable for toolkit cmdlets.
 *
 * The preamble injects a `ConvertTo-Hashtable` function that recursively
 * converts PSCustomObject trees produced by ConvertFrom-Json into native
 * hashtables. This helper generates the expression that calls it.
 *
 * Usage in tool files:
 *   const pricingArg = params.language_direction_pricing_json
 *     ? `-languageDirectionPricing ${psJsonParam(params.language_direction_pricing_json)}`
 *     : "";
 */
export function psJsonParam(jsonString: string): string {
  return `(ConvertTo-Hashtable (${psStr(jsonString)} | ConvertFrom-Json))`;
}

/**
 * Safely parse JSON from PowerShell stdout.
 *
 * Some toolkit functions write warnings or error messages to stdout via
 * Write-Host / Write-Warning before the JSON output. This function:
 *  1. Tries JSON.parse on the full string (fast path).
 *  2. If that fails, scans for the last top-level JSON object ({...})
 *     and tries to parse that.
 *  3. If that also fails, throws with the raw stdout text so the caller
 *     can surface it as a readable error.
 */
export function safeParseJson(stdout: string): object {
  const trimmed = stdout.trim();
  if (!trimmed) return {};

  // Fast path: entire stdout is valid JSON.
  try {
    return JSON.parse(trimmed) as object;
  } catch {
    // Fall through to extraction.
  }

  // Find the last top-level { ... } block.
  // Walk backwards from the end to find the closing }, then match it
  // with its opening {.
  const lastBrace = trimmed.lastIndexOf("}");
  if (lastBrace === -1) {
    throw new Error(trimmed);
  }

  let depth = 0;
  let start = -1;
  for (let i = lastBrace; i >= 0; i--) {
    if (trimmed[i] === "}") depth++;
    if (trimmed[i] === "{") depth--;
    if (depth === 0) {
      start = i;
      break;
    }
  }

  if (start === -1) {
    throw new Error(trimmed);
  }

  const jsonCandidate = trimmed.substring(start, lastBrace + 1);
  try {
    const parsed = JSON.parse(jsonCandidate) as object;

    // If there was prefix text before the JSON, attach it as a warning
    // so the caller can surface it if needed.
    const prefix = trimmed.substring(0, start).trim();
    if (prefix) {
      (parsed as Record<string, unknown>)._warnings = prefix;
    }

    return parsed;
  } catch {
    throw new Error(trimmed);
  }
}

/**
 * Field names within pricing model JSON that represent monetary rates
 * and must be rounded to 3 decimal places (Language Cloud API constraint).
 */
const PRICING_RATE_FIELDS = new Set([
  "perfectMatch",
  "contextMatch",
  "exactMatch",
  "repetition",
  "machineTranslation",
  "new",
  "price",
  "costPerUnit",
]);

/**
 * Round monetary rate values in a pricing model JSON structure to 3dp.
 *
 * The Language Cloud API rejects numeric values with more than 3 decimal
 * places on pricing fields. This function walks the parsed object tree
 * and rounds only the known rate field names, leaving integer fields
 * (minimumMatchValue, maximumMatchValue, unitCount, etc.) untouched.
 *
 * Applied after JSON.parse and before re-serialisation, so the rounding
 * is transparent to both caller and PowerShell.
 */
export function roundPricingDecimals(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => roundPricingDecimals(item));
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      const v = obj[key];
      if (PRICING_RATE_FIELDS.has(key) && typeof v === "number") {
        result[key] = Math.round(v * 1000) / 1000;
      } else {
        result[key] = roundPricingDecimals(v);
      }
    }
    return result;
  }
  return value;
}
