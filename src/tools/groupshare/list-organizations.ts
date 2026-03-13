import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ps7 } from "../../executors/ps7.js";

export function registerListOrganizationsTool(server: McpServer): void {
  server.tool(
    "gs_list_organizations",
    "List all organisations on the GroupShare server. " +
    "Use this to discover organisation names for filtering projects and creating TMs.",
    {},
    async () => {
      try {
        const script = `
          $orgs = Get-AllOrganizations -authorizationToken $authToken
          @{ organizations = @($orgs) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
