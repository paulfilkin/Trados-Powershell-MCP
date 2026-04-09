import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerCompleteTaskTool(server: McpServer): void {
  server.tool(
    "lc_complete_task",
    "Mark a task as completed. Optionally specify an outcome and comment.",
    {
      task_id: z.string().describe("Task ID"),
      outcome: z.string().optional().describe("Task outcome (must match one of the task's applicable outcomes)"),
      comment: z.string().optional().describe("Comment to attach to the completion"),
    },
    async (params) => {
      try {
        const optionalArgs = [
          params.outcome ? `-outcome ${psStr(params.outcome)}` : "",
          params.comment ? `-comment ${psStr(params.comment)}` : "",
        ].filter(Boolean).join(" `\n            ");

        const script = `
          $result = Submit-CompleteTask -accessKey $accessKey -taskId ${psStr(params.task_id)} \`
            ${optionalArgs}
          @{ completed = $true; taskId = ${psStr(params.task_id)}; result = $result } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
