import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerAcceptTaskTool(server: McpServer): void {
  server.tool(
    "lc_accept_task",
    "Accept a task assigned to the current user. The task status changes to inProgress.",
    {
      task_id: z.string().describe("Task ID"),
    },
    async (params) => {
      try {
        const script = `
          $result = Submit-AcceptTask -accessKey $accessKey -taskId ${psStr(params.task_id)}
          @{ accepted = $true; taskId = ${psStr(params.task_id)}; result = $result } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
