import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { join } from "path";
import { ps7 } from "../../executors/ps7.js";
import { psPath } from "../../executors/common.js";
import { setActiveGsCredential } from "../../state.js";

export function registerSetCredentialTool(server: McpServer) {
  server.tool(
    "gs_set_credential",
    "Select a GroupShare credential file from the store and activate it for the current session. All subsequent gs_* tool calls will use this credential until changed or until Claude Desktop is restarted. Returns the server URL and username from the selected file as confirmation.",
    {
      credential_file: z.string().describe("Filename (e.g. groupshare-prod.xml) or full path. If a filename only, resolved against GS_CREDENTIAL_STORE."),
    },
    async (params) => {
      try {
        // Resolve to a full path if only a filename was given
        let filePath = params.credential_file;
        if (!filePath.includes("\\") && !filePath.includes("/")) {
          const store = process.env.GS_CREDENTIAL_STORE;
          if (!store) {
            return {
              content: [{ type: "text", text: "Error: GS_CREDENTIAL_STORE is not set. Provide the full path to the credential file." }],
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

          if (-not $data.ServerUrl) {
            throw "File does not appear to be a GroupShare credential file (missing ServerUrl): $filePath"
          }

          if (-not $data.Credential) {
            throw "File does not appear to be a GroupShare credential file (missing Credential): $filePath"
          }

          @{
            serverUrl = $data.ServerUrl
            username  = $data.Credential.UserName
          } | ConvertTo-Json -Compress
        `;

        const result = await ps7("groupshare", script, { bare: true }) as any;

        // Store the resolved path in server memory
        setActiveGsCredential(filePath);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              message: "GroupShare credential activated.",
              file: filePath,
              serverUrl: result.serverUrl,
              username: result.username,
            }, null, 2),
          }],
        };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
