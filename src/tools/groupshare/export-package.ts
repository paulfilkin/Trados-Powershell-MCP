import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psPath } from "../../executors/common.js";

export function registerExportPackageTool(server: McpServer): void {
  server.tool(
    "gs_export_package",
    "Export a translation package (.sdlppx) from a GroupShare project.",
    {
      project_id:   z.string().optional().describe("Project ID (preferred)"),
      project_name: z.string().optional().describe("Project name (used if ID not provided)"),
      output_path:  z.string().describe("Destination path for the .sdlppx file"),
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
          Export-Package \`
            -authorizationToken      $authToken \`
            -project                 $project \`
            -packageDestinationPath  ${psPath(params.output_path)}
          @{ exported = $true; path = ${psStr(params.output_path)} } | ConvertTo-Json -Compress
        `;

        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
