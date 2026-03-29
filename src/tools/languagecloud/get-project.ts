import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerGetProjectTool(server: McpServer): void {
  server.tool(
    "lc_get_project",
    "Get details of a specific Language Cloud project. Provide project_id or project_name.",
    {
      project_id:   z.string().optional().describe("Project ID"),
      project_name: z.string().optional().describe("Project name"),
    },
    async (params) => {
      try {
        const arg = params.project_id
          ? `-projectId ${psStr(params.project_id)}`
          : `-projectName ${psStr(params.project_name ?? "")}`;

        const script = `
          $project = Get-Project -accessKey $accessKey ${arg}
          if ($null -eq $project) {
            throw "Project not found"
          }
          @{ project = $project } | ConvertTo-Json -Depth 8 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
