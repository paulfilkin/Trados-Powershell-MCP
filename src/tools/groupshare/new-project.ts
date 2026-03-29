import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psPath } from "../../executors/common.js";

export function registerNewProjectTool(server: McpServer): void {
  server.tool(
    "gs_new_project",
    "Create a new project on the GroupShare server using a project template. " +
    "Use gs_list_organizations to find organisation names and gs_list_project_templates to find template names.",
    {
      name:              z.string().describe("Project name"),
      organization_name: z.string().describe("Organisation name"),
      template_name:     z.string().describe("Project template name"),
      files_path:        z.string().describe("Path to a source file, folder, or zip"),
      due_date:          z.string().optional().describe("Due date (YYYY-MM-DD or YYYY-MM-DDThh:mm)"),
      description:       z.string().optional().describe("Project description"),
    },
    async (params) => {
      try {
        const optionalArgs = [
          params.due_date    ? `-dueDate ${psStr(params.due_date)}`       : "",
          params.description ? `-description ${psStr(params.description)}` : "",
        ].filter(Boolean).join(" ");

        const script = `
          $org      = Get-Organization    -authorizationToken $authToken -organizationName ${psStr(params.organization_name)}
          $template = Get-ProjectTemplate -authorizationToken $authToken -projectTemplateName ${psStr(params.template_name)}

          if ($null -eq $org) {
            throw "Organisation not found: ${params.organization_name}"
          }
          if ($null -eq $template) {
            throw "Project template not found: ${params.template_name}"
          }

          $newProject = New-Project \`
            -authorizationToken $authToken \`
            -projectName        ${psStr(params.name)} \`
            -organization       $org \`
            -projectTemplate    $template \`
            -filesPath          ${psPath(params.files_path)} \`
            ${optionalArgs}

          @{ project = $newProject } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("groupshare", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
