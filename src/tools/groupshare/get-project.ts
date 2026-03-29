import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerGetProjectTool(server: McpServer): void {
  server.tool(
    "gs_get_project",
    "Get full details of a GroupShare project - settings, language pairs, and file list with phase and assignment information. " +
    "Provide project_id (preferred) or project_name.",
    {
      project_id:   z.string().optional().describe("Project ID (preferred)"),
      project_name: z.string().optional().describe("Project name (used if ID not provided)"),
    },
    async (params) => {
      try {
        const lookup = params.project_id
          ? `$project = Get-Project -authorizationToken $authToken -projectId ${psStr(params.project_id)}`
          : `$project = Get-Project -authorizationToken $authToken -projectName ${psStr(params.project_name ?? "")}`;

        const script = `
          ${lookup}
          if ($null -eq $project) {
            throw "Project not found"
          }
          $settings = Get-ProjectSettings -authorizationToken $authToken -projectId $project.ProjectId
          $files    = Get-FilesPhasesFromProject -authorizationToken $authToken -projectId $project.ProjectId
          @{
            project  = $project
            settings = $settings
            files    = @($files)
          } | ConvertTo-Json -Depth 8 -Compress
        `;

        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
