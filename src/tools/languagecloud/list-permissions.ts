import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ps7 } from "../../executors/ps7.js";

export function registerListPermissionsTool(server: McpServer): void {
  server.tool(
    "lc_list_permissions",
    "List all permissions available in Language Cloud. " +
    "Use this to discover permission names when creating or updating roles.",
    {},
    async () => {
      try {
        const script = `
          $permissions = Get-AllPermissions -accessKey $accessKey
          @{ permissions = @($permissions) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
