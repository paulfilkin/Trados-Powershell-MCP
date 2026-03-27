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
