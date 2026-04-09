import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerGetProjectFilesExportStatusTool(server: McpServer): void {
  server.tool(
    "lc_get_project_files_export_status",
    "Poll the status of a project files export operation. " +
    "When state is 'completed', use lc_save_project_files to download the ZIP.",
    {
      project_id: z.string().describe("Project ID"),
      export_id:  z.string().describe("Export ID returned by lc_export_project_files"),
    },
    async (params) => {
      try {
        const script = `
          $status = Get-ProjectFilesExportStatus -accessKey $accessKey \`
            -projectId ${psStr(params.project_id)} \`
            -exportId ${psStr(params.export_id)}
          @{ exportStatus = $status } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
