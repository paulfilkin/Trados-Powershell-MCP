import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ps7 } from "../../executors/ps7.js";

export function registerListRolesTool(server: McpServer): void {
  server.tool(
    "lc_list_roles",
    "List all roles available in Language Cloud, including their IDs, names, descriptions, types, and permissions.",
    {},
    async () => {
      try {
        const script = `
          $roles = Get-AllRoles -accessKey $accessKey
          @{ roles = @($roles) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
