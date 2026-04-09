import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerRemoveRoleTool(server: McpServer): void {
  server.tool(
    "lc_remove_role",
    "Delete a custom role from Language Cloud.",
    {
      role_id:   z.string().optional().describe("Role ID"),
      role_name: z.string().optional().describe("Role name"),
    },
    async (params) => {
      try {
        const roleArg = params.role_id
          ? `-roleId ${psStr(params.role_id)}`
          : `-roleName ${psStr(params.role_name ?? "")}`;

        const script = `
          $result = Remove-Role -accessKey $accessKey ${roleArg}
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
