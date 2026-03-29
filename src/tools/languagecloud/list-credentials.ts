import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psPath } from "../../executors/common.js";

export function registerListCredentialsTool(server: McpServer) {
  server.tool(
    "lc_list_credentials",
    "List Language Cloud credential files in the credential store folder. Decrypts and returns the tenant ID and client ID from each XML file. Does not connect to Language Cloud. Use this to discover which credentials are available before calling lc_set_credential.",
    {
      folder_path: z.string().optional().describe("Path to the folder containing Language Cloud credential XML files. Defaults to LC_CREDENTIAL_STORE."),
    },
    async (params) => {
      try {
        const folder = params.folder_path ?? process.env.LC_CREDENTIAL_STORE;
        if (!folder) {
          return {
            content: [{ type: "text", text: "Error: No folder_path provided and LC_CREDENTIAL_STORE is not set." }],
            isError: true,
          };
        }

        const script = `
          $folder = ${psPath(folder)}

          if (-not (Test-Path $folder)) {
            throw "Folder not found: $folder"
          }

          $files = Get-ChildItem -Path $folder -Filter '*.xml' -File

          if ($files.Count -eq 0) {
            @{ credentials = @() } | ConvertTo-Json -Depth 2 -Compress
            return
          }

          $results = $files | ForEach-Object {
            $file = $_
            try {
              $data = Import-CliXml -Path $file.FullName

              $tenant   = $null
              $clientId = $null

              if ($data.lcTenant -and $data.lcTenant -is [System.Security.SecureString]) {
                $ptr    = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($data.lcTenant)
                $tenant = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
                [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
              }

              if ($data.clientId -and $data.clientId -is [System.Security.SecureString]) {
                $ptr      = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($data.clientId)
                $clientId = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
                [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
              }

              [PSCustomObject]@{
                file     = $file.Name
                lcTenant = $tenant
                clientId = $clientId
                valid    = ($null -ne $tenant -and $null -ne $clientId)
              }
            } catch {
              [PSCustomObject]@{
                file     = $file.Name
                lcTenant = $null
                clientId = $null
                valid    = $false
                error    = $_.Exception.Message
              }
            }
          }

          @{ credentials = @($results) } | ConvertTo-Json -Depth 3 -Compress
        `;

        const result = await ps7("languagecloud", script, { bare: true });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
