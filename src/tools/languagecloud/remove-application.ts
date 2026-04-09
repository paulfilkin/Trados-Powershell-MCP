import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerRemoveApplicationTool(server: McpServer): void {
  server.tool(
    "lc_remove_application",
    "Delete an application from Language Cloud.",
    {
      application_id:   z.string().optional().describe("Application ID"),
      application_name: z.string().optional().describe("Application name"),
    },
    async (params) => {
      try {
        const appArg = params.application_id
          ? `-applicationId ${psStr(params.application_id)}`
          : `-applicationName ${psStr(params.application_name ?? "")}`;

        const script = `
          $result = Remove-Application -accessKey $accessKey ${appArg}
          @{ removed = $true; message = "$result" } | ConvertTo-Json -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
