import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerListProjectsTool(server: McpServer): void {
  server.tool(
    "gs_list_projects",
    "List projects on the GroupShare server. Supports filtering by status, organisation, and date range.",
    {
      statuses:          z.string().optional().describe("Comma-separated statuses: Pending, In Progress, Completed, Archived"),
      organization_name: z.string().optional().describe("Filter to projects within a specific organisation"),
      due_start:         z.string().optional().describe("Due date range start (YYYY-MM-DD)"),
      due_end:           z.string().optional().describe("Due date range end (YYYY-MM-DD)"),
    },
    async (params) => {
      try {
        const orgLookup = params.organization_name
          ? `$org = Get-Organization -authorizationToken $authToken -organizationName ${psStr(params.organization_name)}`
          : "";

        const statusArray = params.statuses
          ? `$statuses = @(${params.statuses.split(",").map(s => psStr(s.trim())).join(", ")})`
          : "";

        const callArgs = [
          "-authorizationToken $authToken",
          params.organization_name ? "-organization $org" : "",
          params.statuses          ? "-statuses $statuses"  : "",
          params.due_start         ? `-dueDateStart ${psStr(params.due_start)}` : "",
          params.due_end           ? `-dueDateEnd ${psStr(params.due_end)}`     : "",
        ].filter(Boolean).join(" ");

        const script = `
          ${orgLookup}
          ${statusArray}
          $projects = Get-AllProjects ${callArgs}
          @{ projects = @($projects) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
