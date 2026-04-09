import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psPath } from "../../executors/common.js";

export function registerSaveProjectFilesTool(server: McpServer): void {
  server.tool(
    "lc_save_project_files",
    "Download exported project files as a ZIP archive. " +
    "Must be called after lc_get_project_files_export_status reports 'completed'.",
    {
      project_id:  z.string().describe("Project ID"),
      export_id:   z.string().describe("Export ID returned by lc_export_project_files"),
      output_path: z.string().describe("Local path to save the ZIP file"),
    },
    async (params) => {
      try {
        const script = `
          Save-ProjectFiles -accessKey $accessKey \`
            -projectId ${psStr(params.project_id)} \`
            -exportId ${psStr(params.export_id)} \`
            -outputPath ${psPath(params.output_path)}
          @{ saved = $true; outputPath = ${psStr(params.output_path)} } | ConvertTo-Json -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
