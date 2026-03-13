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
