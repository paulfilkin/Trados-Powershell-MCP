import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerRemoveTermbaseTemplateTool(server: McpServer): void {
  server.tool(
    "lc_remove_termbase_template",
    "Delete a termbase template from Language Cloud.",
    {
      template_id:   z.string().optional().describe("Template ID"),
      template_name: z.string().optional().describe("Template name"),
    },
    async (params) => {
      try {
        const tbArg = params.template_id
          ? `-termbaseTemplateId ${psStr(params.template_id)}`
          : `-termbaseTemplateName ${psStr(params.template_name ?? "")}`;

        const script = `
          $result = Remove-TermbaseTemplate -accessKey $accessKey ${tbArg}
          @{ removed = $true; message = "$result" } | ConvertTo-Json -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
