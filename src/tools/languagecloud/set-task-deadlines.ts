import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerSetTaskDeadlinesTool(server: McpServer): void {
  server.tool(
    "lc_set_task_deadlines",
    "Reschedule the deadlines for one or more workflow tasks in a project.",
    {
      project_id: z.string().describe("Project ID"),
      due_by:     z.string().describe("New deadline as ISO 8601 datetime (e.g. 2026-06-01T12:00:00Z)"),
      task_ids:   z.string().describe("Comma-separated task IDs to reschedule"),
    },
    async (params) => {
      try {
        const taskIdsArray = params.task_ids.split(",").map(id => psStr(id.trim())).join(", ");

        const script = `
          $result = Set-TaskDeadlines -accessKey $accessKey \`
            -projectId ${psStr(params.project_id)} \`
            -dueBy ${psStr(params.due_by)} \`
            -taskIds @(${taskIdsArray})
          @{ rescheduled = $true; result = $result } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
