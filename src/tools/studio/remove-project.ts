import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { studioPs } from "../../executors/studio-ps.js";
import { psPath } from "../../executors/common.js";

export function registerRemoveProjectTool(server: McpServer): void {
  server.tool(
    "studio_remove_project",
    "Remove a project from Trados Studio. " +
    "If delete_files is true, the project folder is also permanently deleted from disk.",
    {
      project_path: z
        .string()
        .describe("Full path to the project folder (directory containing the .sdlproj file)"),
      delete_files: z
        .boolean()
        .optional()
        .describe("Also permanently delete the project folder from disk (default: false)"),
    },
    async (params) => {
      try {
        const deleteFiles = params.delete_files === true;

        const script = `
          $projectPath = ${psPath(params.project_path)}

          $project = Get-Project -projectDestinationPath $projectPath

          if ($null -eq $project) {
            throw "No project found at: $projectPath"
          }

          $info        = $project.GetProjectInfo()
          $projectName = $info.Name

          Remove-Project -projectToDelete $project

          ${deleteFiles ? `
          if (Test-Path $projectPath) {
            Remove-Item -Path $projectPath -Recurse -Force
          }
          ` : ""}

          [PSCustomObject]@{
            status      = "Removed"
            name        = $projectName
            projectPath = $projectPath
            filesDeleted = ${deleteFiles ? "$true" : "$false"}
          } | ConvertTo-Json -Compress
        `;

        const result = await studioPs(script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
