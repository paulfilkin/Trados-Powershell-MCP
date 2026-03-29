import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerListProjectsTool(server: McpServer): void {
  server.tool(
    "gs_list_projects",
    "List projects on the GroupShare server. Supports filtering by status, organisation, date range, and name. " +
    "Set include_sub_organizations to true to include projects from child organisations. " +
    "Use group_by to get a count summary (e.g. by organisation or status) instead of individual projects. " +
    "Use compact mode for a scannable listing.",
    {
      statuses:                z.string().optional().describe("Comma-separated statuses: Pending, In Progress, Completed, Archived"),
      organization_name:       z.string().optional().describe("Filter to projects within a specific organisation"),
      include_sub_organizations: z.boolean().optional().describe("Include projects from child organisations (default: false)"),
      due_start:               z.string().optional().describe("Due date range start (YYYY-MM-DD)"),
      due_end:                 z.string().optional().describe("Due date range end (YYYY-MM-DD)"),
      name_filter:             z.string().optional().describe("Wildcard filter on project name (e.g. '*Newsletter*')"),
      group_by:                z.enum(["organisation", "status", "source_language"]).optional()
                                .describe("Return count summary grouped by this field instead of individual projects"),
      compact:                 z.boolean().optional().describe("Return only name, status, organisation, and languages (default: false)"),
      max_results:             z.number().int().positive().optional().describe("Maximum number of projects to return (default: 50)"),
    },
    async (params) => {
      try {
        const max = params.max_results ?? 50;
        const includeSubOrgs = params.include_sub_organizations === true ? "$true" : "$false";

        const orgLookup = params.organization_name
          ? `$org = Get-Organization -authorizationToken $authToken -organizationName ${psStr(params.organization_name)}`
          : "";

        const statusArray = params.statuses
          ? `$statuses = @(${params.statuses.split(",").map(s => psStr(s.trim())).join(", ")})`
          : "";

        const callArgs = [
          "-authorizationToken $authToken",
          params.organization_name ? "-organization $org" : "",
          `-includeSubOrganizations ${includeSubOrgs}`,
          "-defaultPublishDates $false",
          "-defaultDueDates $false",
          params.statuses  ? "-statuses $statuses"  : "",
          params.due_start ? `-dueDateStart ${psStr(params.due_start)}` : "",
          params.due_end   ? `-dueDateEnd ${psStr(params.due_end)}`     : "",
        ].filter(Boolean).join(" ");

        const nameFilter = params.name_filter
          ? `| Where-Object { $_.Name -like ${psStr(params.name_filter)} }`
          : "";

        // Group-by mode: return counts per group value
        if (params.group_by) {
          const groupField: Record<string, string> = {
            organisation:    "OrganizationName",
            status:          "Status",
            source_language: "SourceLanguage",
          };
          const field = groupField[params.group_by];

          const script = `
            ${orgLookup}
            ${statusArray}
            $all = Get-AllProjects ${callArgs} ${nameFilter}
            $total = @($all).Count
            $groups = @($all) | Group-Object -Property ${field} | ForEach-Object {
              [PSCustomObject]@{
                value = $_.Name
                count = $_.Count
              }
            } | Sort-Object -Property count -Descending

            @{
              total    = $total
              groupBy  = '${params.group_by}'
              groups   = @($groups)
            } | ConvertTo-Json -Depth 5 -Compress
          `;

          const result = await ps7("groupshare", script);
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }

        // Normal mode: return individual projects
        const projection = params.compact
          ? `| ForEach-Object {
              [PSCustomObject]@{
                name             = $_.Name
                status           = $_.Status
                organizationName = $_.OrganizationName
                sourceLanguage   = $_.SourceLanguage
                targetLanguage   = $_.TargetLanguage
              }
            }`
          : "";

        const script = `
          ${orgLookup}
          ${statusArray}
          $all = Get-AllProjects ${callArgs} ${nameFilter}
          $total = @($all).Count
          $results = @($all) | Select-Object -First ${max} ${projection}

          @{
            total         = $total
            returnedCount = @($results).Count
            projects      = @($results)
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
