import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerListOrganizationsTool(server: McpServer): void {
  server.tool(
    "gs_list_organizations",
    "List organisations on the GroupShare server. " +
    "Use parent_path to browse the hierarchy: '/' for top-level, '/Consoltec' for its children, etc. " +
    "Use name_filter with wildcards to search (e.g. '*QA*'). " +
    "Use compact mode for a scannable name + path listing.",
    {
      parent_path:  z.string().optional().describe("Show only direct children of this path (e.g. '/' for top-level, '/Consoltec' for its children)"),
      name_filter:  z.string().optional().describe("Wildcard filter on organisation name (e.g. '*QA*')"),
      compact:      z.boolean().optional().describe("Return only name and path (default: false)"),
      max_results:  z.number().int().positive().optional().describe("Maximum number of organisations to return (default: 50)"),
    },
    async (params) => {
      try {
        const max = params.max_results ?? 50;

        const nameFilter = params.name_filter
          ? `| Where-Object { $_.Name -like ${psStr(params.name_filter)} }`
          : "";

        // Parent path filter: match orgs whose path equals parent_path + / + name
        // i.e. direct children only, not deeper descendants.
        const parentFilter = params.parent_path
          ? `| Where-Object {
              $orgPath = $_.Path
              $parent = ${psStr(params.parent_path.replace(/\/+$/, "") || "/")}
              if ($parent -eq '/') {
                ($orgPath -replace '/[^/]+$', '') -eq '' -or ($orgPath -replace '/[^/]+$', '') -eq '/'
              } else {
                ($orgPath -replace '/[^/]+$', '') -eq $parent
              }
            }`
          : "";

        const projection = params.compact
          ? `| ForEach-Object {
              [PSCustomObject]@{
                name = $_.Name
                path = $_.Path
              }
            }`
          : "";

        const script = `
          $all = Get-AllOrganizations -authorizationToken $authToken
          $total = @($all).Count
          $filtered = @($all) ${nameFilter} ${parentFilter}
          $filteredCount = @($filtered).Count
          $results = @($filtered) | Select-Object -First ${max} ${projection}

          @{
            total          = $total
            matchingCount  = $filteredCount
            returnedCount  = @($results).Count
            organizations  = @($results)
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
