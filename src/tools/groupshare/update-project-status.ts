import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerUpdateProjectStatusTool(server: McpServer): void {
  server.tool(
    "gs_update_project_status",
    "Change the status of a GroupShare project. Accepted values are Completed and Started. " +
    "Setting Completed affects assignments and visibility for all project members on the server.",
    {
      project_id:   z.string().optional().describe("Project ID (preferred)"),
      project_name: z.string().optional().describe("Project name (used if ID not provided)"),
      status:       z.enum(["Completed", "Started"]).describe("New status: Completed or Started"),
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
          Update-ProjectStatus -authorizationToken $authToken -project $project -status ${psStr(params.status)}
          @{ updated = $true; status = ${psStr(params.status)} } | ConvertTo-Json -Compress
        `;

        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
