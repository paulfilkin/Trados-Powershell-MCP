import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerListTmsTool(server: McpServer): void {
  server.tool(
    "gs_list_tms",
    "List translation memories on the GroupShare server. " +
    "If container_name is provided the list is filtered to that container; otherwise all TMs are returned. " +
    "Use name_filter with wildcards to search (e.g. '*Marketing*').",
    {
      container_name: z.string().optional().describe("Filter to TMs within a specific container"),
      name_filter:    z.string().optional().describe("Wildcard filter on TM name (e.g. '*Marketing*')"),
      compact:        z.boolean().optional().describe("Return only name and language pair (default: false)"),
      max_results:    z.number().int().positive().optional().describe("Maximum number of TMs to return (default: 50)"),
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
                name           = $_.Name
                sourceLanguage = $_.SourceLanguageCode
                targetLanguage = $_.TargetLanguageCode
              }
            }`
          : "";

        const fetchBlock = params.container_name
          ? `
            $container = Get-Container -authorizationToken $authToken -containerName ${psStr(params.container_name)}
            if ($null -eq $container) {
              throw "Container not found: ${params.container_name}"
            }
            $all = Get-TMsByContainer -authorizationToken $authToken -container $container
          `
          : `
            $all = Get-AllTMs -authorizationToken $authToken
          `;

        const script = `
          ${fetchBlock}
          $total = @($all).Count
          $filtered = @($all) ${nameFilter}
          $filteredCount = @($filtered).Count
          $results = @($filtered) | Select-Object -First ${max} ${projection}

          @{
            total         = $total
            matchingCount = $filteredCount
            returnedCount = @($results).Count
            tms           = @($results)
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
