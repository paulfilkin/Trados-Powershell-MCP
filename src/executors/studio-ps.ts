import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";
import { extractPsError, safeParseJson } from "./common.js";

const execFileAsync = promisify(execFile);

const PS5_PATH =
  process.env.STUDIO_PS_PATH ??
  "C:\\Windows\\SysWOW64\\WindowsPowerShell\\v1.0\\powershell.exe";

const STUDIO_VERSION = process.env.STUDIO_VERSION ?? "Studio18";
const STUDIO_MODULES_PATH = process.env.STUDIO_MODULES_PATH ?? "";

// UTF-8 BOM - required for PowerShell 5.1 to read .ps1 files as UTF-8.
const UTF8_BOM = "\uFEFF";

interface StudioPsOptions {
  /** Skip Import-ToolkitModules. Use for scripts that read local files directly
   *  and do not need the Project Automation API (e.g. parsing projects.xml). */
  bare?: boolean;
}

export async function studioPs(scriptBody: string, options: StudioPsOptions = {}): Promise<object> {
  const modulePathBlock = STUDIO_MODULES_PATH
    ? `$env:PSModulePath = "${STUDIO_MODULES_PATH.replace(/\\/g, "\\\\")};" + $env:PSModulePath`
    : "";

  const toolkitPreamble = options.bare
    ? ""
    : `Import-Module -Name ToolkitInitializer -ErrorAction Stop
      Import-ToolkitModules -StudioVersion "${STUDIO_VERSION}"`;

  const script = `
    Set-StrictMode -Off
    $ErrorActionPreference = "Stop"
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    try {
      ${modulePathBlock}
      ${toolkitPreamble}
      ${scriptBody}
    } catch {
      $err = @{ error = $_.Exception.Message; detail = $_.ScriptStackTrace }
      Write-Error ($err | ConvertTo-Json -Compress)
      exit 1
    }
  `;

  // Write to a temp .ps1 file with UTF-8 BOM so Unicode paths survive.
  // Passing scripts via -Command goes through Windows command-line parsing
  // which can mangle non-ASCII characters on ANSI codepage systems.
  const tempId = randomBytes(8).toString("hex");
  const tempScript = join(tmpdir(), `trados-mcp-${tempId}.ps1`);

  try {
    await writeFile(tempScript, UTF8_BOM + script, "utf-8");

    const { stdout, stderr } = await execFileAsync(
      PS5_PATH,
      [
        "-NonInteractive",
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", tempScript,
      ],
      { timeout: 600000, maxBuffer: 50 * 1024 * 1024, windowsHide: true }
    );

    if (stderr?.trim()) throw new Error(extractPsError(stderr));
    return safeParseJson(stdout);
  } finally {
    // Clean up temp file - best effort, don't throw if it fails.
    await unlink(tempScript).catch(() => {});
  }
}
