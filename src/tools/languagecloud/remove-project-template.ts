import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerRemoveProjectTemplateTool(server: McpServer): void {
  server.tool(
    "lc_remove_project_template",
    "Delete a project template from Language Cloud.",
    {
      template_id: z.string().describe("Project template ID (from lc_list_project_templates)"),
    },
    async (params) => {
      try {
        const script = `
          $result = Remove-ProjectTemplate -accessKey $accessKey -projectTemplateId ${psStr(params.template_id)}
          @{ removed = $true; templateId = ${psStr(params.template_id)}; message = "$result" } | ConvertTo-Json -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
