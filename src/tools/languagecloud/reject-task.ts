import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerRejectTaskTool(server: McpServer): void {
  server.tool(
    "lc_reject_task",
    "Reject a task, returning it to the pool for other assignees.",
    {
      task_id: z.string().describe("Task ID"),
    },
    async (params) => {
      try {
        const script = `
          $result = Submit-RejectTask -accessKey $accessKey -taskId ${psStr(params.task_id)}
          @{ rejected = $true; taskId = ${psStr(params.task_id)}; result = $result } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
