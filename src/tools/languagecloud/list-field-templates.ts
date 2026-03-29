import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerListFieldTemplatesTool(server: McpServer): void {
  server.tool(
    "lc_list_field_templates",
    "List all field templates in Language Cloud. " +
    "Use this to discover the field template name or ID required by lc_new_tm.",
    {
      location_id:       z.string().optional().describe("Scope to a specific location ID"),
      location_strategy: z.string().optional().describe("Location resolution strategy (e.g. bloodline) - also searches parent locations"),
    },
    async (params) => {
      try {
        const optionalArgs = [
          params.location_id       ? `-locationId ${psStr(params.location_id)}`             : "",
          params.location_strategy ? `-locationStrategy ${psStr(params.location_strategy)}` : "",
        ].filter(Boolean).join(" ");

        const script = `
          $templates = Get-AllFieldTemplates -accessKey $accessKey ${optionalArgs}
          @{ fieldTemplates = @($templates) } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
