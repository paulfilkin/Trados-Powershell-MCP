import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerListProjectTemplatesTool(server: McpServer): void {
  server.tool(
    "gs_list_project_templates",
    "List project templates available on the GroupShare server. " +
    "Use this to discover template names for gs_new_project. " +
    "Use name_filter with wildcards to search (e.g. '*Legal*').",
    {
      name_filter:  z.string().optional().describe("Wildcard filter on template name (e.g. '*Legal*')"),
      compact:      z.boolean().optional().describe("Return only template names (default: false)"),
      max_results:  z.number().int().positive().optional().describe("Maximum number of templates to return (default: 50)"),
    },
    async (params) => {
      try {
        const max = params.max_results ?? 50;

        const nameFilter = params.name_filter
          ? `| Where-Object { $_.Name -like ${psStr(params.name_filter)} }`
          : "";

        const projection = params.compact
          ? `| ForEach-Object {
              [PSCustomObject]@{
                name = $_.Name
              }
            }`
          : "";

        const script = `
          $all = Get-AllProjectTemplates -authorizationToken $authToken ${nameFilter}
          $total = @($all).Count
          $results = @($all) | Select-Object -First ${max} ${projection}

          @{
            total         = $total
            returnedCount = @($results).Count
            templates     = @($results)
          } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
