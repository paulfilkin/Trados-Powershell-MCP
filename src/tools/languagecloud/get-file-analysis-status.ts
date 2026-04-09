import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerGetFileAnalysisStatusTool(server: McpServer): void {
  server.tool(
    "lc_get_file_analysis_status",
    "Poll the status of a file analysis operation. " +
    "Returns word counts and per-file statistics when complete.",
    {
      operation_id: z.string().describe("Operation ID from lc_request_file_analysis"),
    },
    async (params) => {
      try {
        const script = `
          $status = Get-FileAnalysisStatus -accessKey $accessKey -operationId ${psStr(params.operation_id)}
          @{ analysisStatus = $status } | ConvertTo-Json -Depth 8 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
