import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerListUsersTool(server: McpServer): void {
  server.tool(
    "gs_list_users",
    "List users on the GroupShare server. " +
    "Optionally filter to a specific organisation.",
    {
      organization_name: z.string().optional().describe("Filter to users within this organisation"),
      max_limit:         z.number().int().positive().optional().describe("Maximum number of users to return (default: 100)"),
    },
    async (params) => {
      try {
        const maxLimit = params.max_limit ?? 100;

        const orgLookup = params.organization_name
          ? `$org = Get-Organization -authorizationToken $authToken -organizationName ${psStr(params.organization_name)}`
          : "";

        const orgArg = params.organization_name ? "-organization $org" : "";

        const script = `
          ${orgLookup}
          $users = Get-AllUsers -authorizationToken $authToken ${orgArg} -maxLimit ${maxLimit}
          @{ users = @($users) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
