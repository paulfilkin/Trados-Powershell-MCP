import { execFile } from "child_process";
import { promisify } from "util";
import { psStr, psPath, extractPsError, safeParseJson } from "./common.js";
import { activeGsCredentialFile, activeLcCredentialFile } from "../state.js";

const execFileAsync = promisify(execFile);

const PS7_PATH = process.env.PS7_PATH || "pwsh.exe";

type ToolkitType = "groupshare" | "languagecloud";

interface Ps7Options {
  bare?: boolean; // skip module loading and auth preamble entirely
}

function buildPreamble(type: ToolkitType): string {
  if (type === "groupshare") {
    const modulesPath = process.env.GS_MODULES_PATH;
    const modulePathBlock = modulesPath
      ? `$env:PSModulePath = ${psStr(modulesPath)} + [System.IO.Path]::PathSeparator + $env:PSModulePath`
      : "";

    const credFile = activeGsCredentialFile;
    let authBlock: string;
    if (credFile) {
      authBlock = `
        $credData  = Import-CliXml -Path ${psPath(credFile)}
        $serverUrl = $credData.ServerUrl
        $gsUser    = $credData.Credential.UserName
        $gsPass    = $credData.Credential.GetNetworkCredential().Password
      `;
    } else {
      const server = process.env.GS_SERVER_URL!;
      const user   = process.env.GS_USERNAME!;
      const pass   = process.env.GS_PASSWORD!;
      authBlock = `
        $serverUrl = ${psStr(server)}
        $gsUser    = ${psStr(user)}
        $gsPass    = ${psStr(pass)}
      `;
    }
    return `
      ${modulePathBlock}
      ${authBlock}
      Import-Module -Name AuthenticationHelper        -ArgumentList $serverUrl -ErrorAction Stop
      Import-Module -Name ProjectServerHelper         -ArgumentList $serverUrl -ErrorAction Stop
      Import-Module -Name ResourcesHelper             -ArgumentList $serverUrl -ErrorAction Stop
      Import-Module -Name UserManagerHelper           -ArgumentList $serverUrl -ErrorAction Stop
      Import-Module -Name BackgroundTaskHelper        -ArgumentList $serverUrl -ErrorAction Stop
      Import-Module -Name SystemConfigurationHelper   -ArgumentList $serverUrl -ErrorAction Stop
      $authToken = SignIn -userName $gsUser -password $gsPass
    `;
  } else {
    const modulesPath = process.env.LC_MODULES_PATH;
    const modulePathBlock = modulesPath
      ? `$env:PSModulePath = ${psStr(modulesPath)} + [System.IO.Path]::PathSeparator + $env:PSModulePath`
      : "";

    const credFile = activeLcCredentialFile;
    let authBlock: string;
    if (credFile) {
      authBlock = `
        $credData     = Import-CliXml -Path ${psPath(credFile)}
        $ptr          = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($credData.lcTenant)
        $lcTenant     = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
        $ptr          = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($credData.clientId)
        $clientId     = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
        $ptr          = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($credData.clientSecret)
        $clientSecret = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
      `;
    } else {
      const clientId     = process.env.LC_CLIENT_ID!;
      const clientSecret = process.env.LC_CLIENT_SECRET!;
      const tenant       = process.env.LC_TENANT_ID!;
      authBlock = `
        $clientId     = ${psStr(clientId)}
        $clientSecret = ${psStr(clientSecret)}
        $lcTenant     = ${psStr(tenant)}
      `;
    }
    return `
      ${modulePathBlock}
      ${authBlock}
      Import-Module -Name AuthenticationHelper -ErrorAction Stop
      Import-Module -Name ProjectHelper        -ErrorAction Stop
      Import-Module -Name ResourcesHelper      -ErrorAction Stop
      Import-Module -Name UsersHelper          -ErrorAction Stop
      Import-Module -Name TerminologyHelper    -ErrorAction Stop
      $accessKey = Get-AccessKey -id $clientId -secret $clientSecret -lcTenant $lcTenant
    `;
  }
}

export async function ps7(type: ToolkitType, scriptBody: string, options: Ps7Options = {}): Promise<object> {
  const preamble = options.bare ? "" : buildPreamble(type);

  const script = `
    Set-StrictMode -Off
    $ErrorActionPreference = "Stop"
    try {
      ${preamble}
      ${scriptBody}
    } catch {
      $err = @{ error = $_.Exception.Message; detail = $_.ScriptStackTrace }
      Write-Error ($err | ConvertTo-Json -Compress)
      exit 1
    }
  `;

  const { stdout, stderr } = await execFileAsync(
    PS7_PATH,
    ["-NonInteractive", "-NoProfile", "-Command", script],
    { timeout: 600000, maxBuffer: 50 * 1024 * 1024, windowsHide: true }
  );

  if (stderr?.trim()) throw new Error(extractPsError(stderr));
  return safeParseJson(stdout);
}
