import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psJsonParam } from "../../executors/common.js";

export function registerAssignTaskTool(server: McpServer): void {
  server.tool(
    "lc_assign_task",
    "Assign a task to one or more users or groups. " +
    "Pass assignees as a JSON array string, e.g. [{\"id\":\"user-123\",\"type\":\"user\"}].",
    {
      task_id:   z.string().describe("Task ID"),
      assignees: z.string().describe("JSON array of assignee objects with 'id' and 'type' (user or group)"),
    },
    async (params) => {
      try {
        const script = `
          $assigneesArray = ${psJsonParam(params.assignees)}
          $result = Set-TaskAssignment -accessKey $accessKey -taskId ${psStr(params.task_id)} -assignees $assigneesArray
          @{ assigned = $true; taskId = ${psStr(params.task_id)}; result = $result } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
