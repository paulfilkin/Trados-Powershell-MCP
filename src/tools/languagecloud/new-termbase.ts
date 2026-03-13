import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerNewTermbaseTool(server: McpServer): void {
  server.tool(
    "lc_new_termbase",
    "Create a new termbase in Language Cloud.",
    {
      name: z.string().describe("Termbase name"),
      termbase_template: z.string().describe("Termbase template name or ID"),
      description: z.string().optional().describe("Optional description"),
    },
    async (params) => {
      try {
        const descriptionBlock = params.description
          ? `-termbaseDescription ${psStr(params.description)}`
          : "";

        const script = `
          $termbase = New-Termbase \`
            -accessKey              $accessKey \`
            -termbaseName           ${psStr(params.name)} \`
            -termbaseTemplateName   ${psStr(params.termbase_template)} \`
            ${descriptionBlock}

          [PSCustomObject]@{
            id          = $termbase.Id
            name        = $termbase.Name
            description = $termbase.Description
            template    = $termbase.TemplateName
          } | ConvertTo-Json -Compress
        `;
        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
