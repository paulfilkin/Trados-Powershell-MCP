import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerListContainersTool(server: McpServer): void {
  server.tool(
    "gs_list_containers",
    "List containers on the GroupShare server. " +
    "If organization_name is provided, filters to containers owned by that organisation (matching OwnerId). " +
    "Use name_filter with wildcards to search (e.g. '*Production*'). " +
    "Use compact mode for a scannable name + owner listing.",
    {
      organization_name: z.string().optional().describe("Filter to containers owned by this organisation"),
      name_filter:       z.string().optional().describe("Wildcard filter on container name (e.g. '*Production*')"),
      compact:           z.boolean().optional().describe("Return only name and owner organisation (default: false)"),
      max_results:       z.number().int().positive().optional().describe("Maximum number of containers to return (default: 50)"),
    },
    async (params) => {
      try {
        const max = params.max_results ?? 50;

        // If filtering by org, we need to look up the org to get its UniqueId
        const orgLookup = params.organization_name
          ? `
            $org = Get-Organization -authorizationToken $authToken -organizationName ${psStr(params.organization_name)}
            if ($null -eq $org) { throw "Organisation not found: ${params.organization_name}" }
          `
          : "";

        const orgFilter = params.organization_name
          ? `| Where-Object { $_.OwnerId -eq $org.UniqueId }`
          : "";

        const nameFilter = params.name_filter
          ? `| Where-Object { $_.DisplayName -like ${psStr(params.name_filter)} }`
          : "";

        const projection = params.compact
          ? `| ForEach-Object {
              [PSCustomObject]@{
                name        = $_.DisplayName
                containerId = $_.ContainerId
              }
            }`
          : "";

        const script = `
          ${orgLookup}
          $all = Get-AllContainers -authorizationToken $authToken
          $total = @($all).Count
          $filtered = @($all) ${orgFilter} ${nameFilter}
          $filteredCount = @($filtered).Count
          $results = @($filtered) | Select-Object -First ${max} ${projection}

          @{
            total         = $total
            matchingCount = $filteredCount
            returnedCount = @($results).Count
            containers    = @($results)
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
