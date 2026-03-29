import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psPath } from "../../executors/common.js";

export function registerListCredentialsTool(server: McpServer) {
  server.tool(
    "gs_list_credentials",
    "List GroupShare credential files in the credential store folder. Decrypts and returns the server URL and username from each XML file. Does not connect to GroupShare. Use this to discover which credentials are available before calling gs_set_credential.",
    {
      folder_path: z.string().optional().describe("Path to the folder containing GroupShare credential XML files. Defaults to GS_CREDENTIAL_STORE."),
    },
    async (params) => {
      try {
        const folder = params.folder_path ?? process.env.GS_CREDENTIAL_STORE;
        if (!folder) {
          return {
            content: [{ type: "text", text: "Error: No folder_path provided and GS_CREDENTIAL_STORE is not set." }],
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

              $serverUrl = $null
              $username  = $null

              if ($data.ServerUrl) {
                $serverUrl = $data.ServerUrl
              }

              if ($data.Credential -and $data.Credential.UserName) {
                $username = $data.Credential.UserName
              }

              [PSCustomObject]@{
                file      = $file.Name
                serverUrl = $serverUrl
                username  = $username
                valid     = ($null -ne $serverUrl -and $null -ne $username)
              }
            } catch {
              [PSCustomObject]@{
                file      = $file.Name
                serverUrl = $null
                username  = $null
                valid     = $false
                error     = $_.Exception.Message
              }
            }
          }

          @{ credentials = @($results) } | ConvertTo-Json -Depth 3 -Compress
        `;

        const result = await ps7("groupshare", script, { bare: true });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
