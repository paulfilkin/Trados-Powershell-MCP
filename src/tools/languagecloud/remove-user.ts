import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerRemoveUserTool(server: McpServer): void {
  server.tool(
    "lc_remove_user",
    "Delete a user from Language Cloud. The user can be identified by ID or email.",
    {
      user_id:    z.string().optional().describe("User ID"),
      user_email: z.string().optional().describe("User email (alternative to ID)"),
    },
    async (params) => {
      try {
        const userArg = params.user_id
          ? `-userId ${psStr(params.user_id)}`
          : `-userEmail ${psStr(params.user_email ?? "")}`;

        const script = `
          $result = Remove-User -accessKey $accessKey ${userArg}
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
