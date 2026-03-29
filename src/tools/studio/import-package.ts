import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { studioPs } from "../../executors/studio-ps.js";
import { psPath } from "../../executors/common.js";

export function registerImportPackageTool(server: McpServer): void {
  server.tool(
    "studio_import_package",
    "Import a return package (.sdlrpx) from a linguist back into a Trados Studio project.",
    {
      project_path: z
        .string()
        .describe("Full path to the project folder (directory containing the .sdlproj file)"),
      package_path: z
        .string()
        .describe("Path to the .sdlrpx return package file"),
    },
    async (params) => {
      try {
        const script = `
          $project = Get-Project -projectDestinationPath ${psPath(params.project_path)}

          if ($null -eq $project) {
            throw "No project found at: ${psPath(params.project_path)}"
          }

          Import-Package -projectToProcess $project -importPath ${psPath(params.package_path)}

          $project.Save()

          [PSCustomObject]@{
            status      = "Imported"
            projectPath = ${psPath(params.project_path)}
            packagePath = ${psPath(params.package_path)}
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
