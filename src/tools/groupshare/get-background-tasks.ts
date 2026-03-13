import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerGetBackgroundTasksTool(server: McpServer): void {
  server.tool(
    "gs_get_background_tasks",
    "List background tasks on the GroupShare server. Use this to poll the status of async " +
    "operations such as project creation and TMX import. Call repeatedly to check whether a " +
    "previously started operation has completed.",
    {
      status: z.enum(["Pending", "Running", "Completed", "Failed", "Cancelled"]).optional()
        .describe("Filter by task status"),
      task_type: z.string().optional()
        .describe("Filter by task type substring (e.g. CreateProject, ImportTMX)"),
    },
    async (params) => {
      try {
        const statusFilter = params.status
          ? `| Where-Object { $_.Status -eq ${psStr(params.status)} }`
          : "";
        const typeFilter = params.task_type
          ? `| Where-Object { $_.Type -like ${psStr("*" + params.task_type + "*")} }`
          : "";

        const script = `
          $tasks = @(Get-AllBackgroundTasks -authorizationToken $authToken ${statusFilter} ${typeFilter})
          @{ tasks = @($tasks | ForEach-Object {
            [PSCustomObject]@{
              id         = $_.Id
              type       = $_.Type
              status     = $_.Status
              percent    = $_.PercentComplete
              createdAt  = $_.CreatedAt
              finishedAt = $_.FinishedAt
              messages   = $_.Messages
            }
          }) } | ConvertTo-Json -Depth 5 -Compress
        `;
        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
