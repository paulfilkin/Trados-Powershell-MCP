import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerGetTaskTool(server: McpServer): void {
  server.tool(
    "lc_get_task",
    "Get details of a specific workflow task by its ID.",
    {
      task_id: z.string().describe("Task ID"),
      fields:  z.string().optional().describe("Comma-separated list of fields to include in the response"),
    },
    async (params) => {
      try {
        const fieldsArg = params.fields
          ? `-fields ${psStr(params.fields)}`
          : "";

        const script = `
          $task = Get-Task -accessKey $accessKey -taskId ${psStr(params.task_id)} ${fieldsArg}
          @{ task = $task } | ConvertTo-Json -Depth 8 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
