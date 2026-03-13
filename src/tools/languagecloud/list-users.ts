import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ps7 } from "../../executors/ps7.js";

export function registerListUsersTool(server: McpServer): void {
  server.tool(
    "lc_list_users",
    "List users in Language Cloud.",
    {},
    async () => {
      try {
        const script = `
          $users = Get-AllUsers -accessKey $accessKey
          @{ users = @($users) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
