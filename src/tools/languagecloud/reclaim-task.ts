import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerReclaimTaskTool(server: McpServer): void {
  server.tool(
    "lc_reclaim_task",
    "Reclaim a task, removing the current owner so other assignees can accept it.",
    {
      task_id: z.string().describe("Task ID"),
    },
    async (params) => {
      try {
        const script = `
          $result = Submit-ReclaimTask -accessKey $accessKey -taskId ${psStr(params.task_id)}
          @{ reclaimed = $true; taskId = ${psStr(params.task_id)}; result = $result } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
