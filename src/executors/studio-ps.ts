import { execFile } from "child_process";
import { promisify } from "util";
import { extractPsError } from "./common.js";

const execFileAsync = promisify(execFile);

const PS5_PATH =
  process.env.STUDIO_PS_PATH ??
  "C:\\Windows\\SysWOW64\\WindowsPowerShell\\v1.0\\powershell.exe";

const STUDIO_VERSION = process.env.STUDIO_VERSION ?? "Studio18";
const STUDIO_MODULES_PATH = process.env.STUDIO_MODULES_PATH ?? "";

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

  const { stdout, stderr } = await execFileAsync(
    PS5_PATH,
    ["-NonInteractive", "-NoProfile", "-Command", script],
    { timeout: 600000, maxBuffer: 50 * 1024 * 1024, windowsHide: true }
  );

  if (stderr?.trim()) throw new Error(extractPsError(stderr));
  return stdout.trim() ? (JSON.parse(stdout.trim()) as object) : {};
}
