import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { join } from "path";
import { ps7 } from "../../executors/ps7.js";
import { psPath } from "../../executors/common.js";
import { setActiveLcCredential } from "../../state.js";

export function registerSetCredentialTool(server: McpServer) {
  server.tool(
    "lc_set_credential",
    "Select a Language Cloud credential file from the store and activate it for the current session. All subsequent lc_* tool calls will use this credential until changed or until Claude Desktop is restarted. Returns the tenant ID and client ID from the selected file as confirmation.",
    {
      credential_file: z.string().describe("Filename (e.g. languagecloud-prod.xml) or full path. If a filename only, resolved against LC_CREDENTIAL_STORE."),
    },
    async (params) => {
      try {
        // Resolve to a full path if only a filename was given
        let filePath = params.credential_file;
        if (!filePath.includes("\\") && !filePath.includes("/")) {
          const store = process.env.LC_CREDENTIAL_STORE;
          if (!store) {
            return {
              content: [{ type: "text", text: "Error: LC_CREDENTIAL_STORE is not set. Provide the full path to the credential file." }],
              isError: true,
            };
          }
          filePath = join(store, filePath);
        }

        // Decrypt and validate - bare: true so no modules are loaded
        const script = `
          $filePath = ${psPath(filePath)}

          if (-not (Test-Path $filePath)) {
            throw "Credential file not found: $filePath"
          }

          $data = Import-CliXml -Path $filePath

          if (-not $data.lcTenant) {
            throw "File does not appear to be a Language Cloud credential file (missing lcTenant): $filePath"
          }

          $ptr      = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($data.lcTenant)
          $lcTenant = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
          [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)

          $ptr      = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($data.clientId)
          $clientId = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
          [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)

          @{
            lcTenant = $lcTenant
            clientId = $clientId
          } | ConvertTo-Json -Compress
        `;

        const result = await ps7("languagecloud", script, { bare: true }) as any;

        // Store the resolved path in server memory
        setActiveLcCredential(filePath);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              message: "Language Cloud credential activated.",
              file: filePath,
              lcTenant: result.lcTenant,
              clientId: result.clientId,
            }, null, 2),
          }],
        };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
