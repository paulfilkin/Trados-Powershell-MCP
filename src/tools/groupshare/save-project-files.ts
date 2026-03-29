import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psPath } from "../../executors/common.js";

export function registerSaveProjectFilesTool(server: McpServer): void {
  server.tool(
    "gs_save_project_files",
    "Download project files from GroupShare as a zip archive. " +
    "Type 'targetnativefiles' supports the include_tms option; type 'all' does not.",
    {
      project_id:   z.string().optional().describe("Project ID (preferred)"),
      project_name: z.string().optional().describe("Project name (used if ID not provided)"),
      output_path:  z.string().describe("Destination path for the .zip file"),
      type:         z.enum(["all", "targetnativefiles"]).optional().describe("File set to download (default: all)"),
      include_tms:  z.boolean().optional().describe("Include TMs in the download - only valid with targetnativefiles"),
    },
    async (params) => {
      try {
        const lookup = params.project_id
          ? `$project = Get-Project -authorizationToken $authToken -projectId ${psStr(params.project_id)}`
          : `$project = Get-Project -authorizationToken $authToken -projectName ${psStr(params.project_name ?? "")}`;

        const fileType   = params.type        ?? "all";
        const includeTms = params.include_tms ?? false;

        const script = `
          ${lookup}
          if ($null -eq $project) {
            throw "Project not found"
          }
          Save-AllProjectsFile \`
            -authorizationToken $authToken \`
            -project            $project \`
            -outputLocation     ${psPath(params.output_path)} \`
            -type               ${psStr(fileType)} \`
            -includeTMs         $${includeTms ? "true" : "false"}
          @{ saved = $true; path = ${psStr(params.output_path)} } | ConvertTo-Json -Compress
        `;

        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
