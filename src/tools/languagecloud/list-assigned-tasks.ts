import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerListAssignedTasksTool(server: McpServer): void {
  server.tool(
    "lc_list_assigned_tasks",
    "List workflow tasks assigned to the authenticated user. " +
    "Supports filtering by status and location, pagination, and sorting.",
    {
      status:            z.string().optional().describe("Filter by status: created, inProgress, completed, failed, skipped, canceled"),
      location:          z.string().optional().describe("Comma-separated location IDs to filter by"),
      location_strategy: z.string().optional().describe("Location filter strategy: location, lineage, bloodline, genealogy"),
      fields:            z.string().optional().describe("Comma-separated fields to include"),
      sort:              z.string().optional().describe("Comma-separated sort fields (prefix with - for descending)"),
      skip:              z.number().optional().describe("Items to skip for pagination"),
      top:               z.number().optional().describe("Items per page (1-100)"),
    },
    async (params) => {
      try {
        const optionalArgs = [
          params.status            ? `-status ${psStr(params.status)}`                       : "",
          params.location_strategy ? `-locationStrategy ${psStr(params.location_strategy)}`   : "",
          params.fields            ? `-fields ${psStr(params.fields)}`                       : "",
          params.sort              ? `-sort ${psStr(params.sort)}`                           : "",
          params.skip !== undefined ? `-skip ${params.skip}`                                 : "",
          params.top !== undefined  ? `-top ${params.top}`                                   : "",
        ].filter(Boolean).join(" `\n            ");

        const locationArg = params.location
          ? params.location.split(",").map(l => `-location ${psStr(l.trim())}`).join(" ")
          : "";

        const script = `
          $tasks = Get-AssignedTasks -accessKey $accessKey \`
            ${locationArg ? locationArg + " `" : ""}
            ${optionalArgs}
          @{ tasks = $tasks } | ConvertTo-Json -Depth 8 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
