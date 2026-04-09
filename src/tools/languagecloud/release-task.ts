import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerReleaseTaskTool(server: McpServer): void {
  server.tool(
    "lc_release_task",
    "Release a task from its current owner back to the pool.",
    {
      task_id: z.string().describe("Task ID"),
    },
    async (params) => {
      try {
        const script = `
          $result = Submit-ReleaseTask -accessKey $accessKey -taskId ${psStr(params.task_id)}
          @{ released = $true; taskId = ${psStr(params.task_id)}; result = $result } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
