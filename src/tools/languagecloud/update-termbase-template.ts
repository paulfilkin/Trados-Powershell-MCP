import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerUpdateTermbaseTemplateTool(server: McpServer): void {
  server.tool(
    "lc_update_termbase_template",
    "Update an existing termbase template's name, description, or languages.",
    {
      template_id:    z.string().optional().describe("Template ID"),
      template_name:  z.string().optional().describe("Template name (alternative to ID for lookup)"),
      name:           z.string().optional().describe("New name"),
      description:    z.string().optional().describe("New description"),
      language_codes: z.string().optional().describe("Comma-separated language codes"),
    },
    async (params) => {
      try {
        const tbArg = params.template_id
          ? `-termbaseTemplateId ${psStr(params.template_id)}`
          : `-termbaseTemplateName ${psStr(params.template_name ?? "")}`;

        const optionalArgs = [
          params.name        ? `-name ${psStr(params.name)}`               : "",
          params.description ? `-description ${psStr(params.description)}` : "",
        ].filter(Boolean).join(" `\n            ");

        const langArg = params.language_codes
          ? `-languageCodes @(${params.language_codes.split(",").map(l => psStr(l.trim())).join(", ")})`
          : "";

        const script = `
          Update-TermbaseTemplate -accessKey $accessKey \`
            ${tbArg} \`
            ${langArg ? langArg + " `" : ""}
            ${optionalArgs}
          @{ updated = $true } | ConvertTo-Json -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
