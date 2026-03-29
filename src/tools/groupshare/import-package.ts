import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psPath } from "../../executors/common.js";

export function registerImportPackageTool(server: McpServer): void {
  server.tool(
    "gs_import_package",
    "Import a return package (.sdlrpx) from a linguist back into a GroupShare project.",
    {
      project_id:   z.string().optional().describe("Project ID (preferred)"),
      project_name: z.string().optional().describe("Project name (used if ID not provided)"),
      package_path: z.string().describe("Path to the .sdlrpx file"),
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
          Import-Package \`
            -authorizationToken $authToken \`
            -project            $project \`
            -packagePath        ${psPath(params.package_path)}
          @{ imported = $true; path = ${psStr(params.package_path)} } | ConvertTo-Json -Compress
        `;

        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
