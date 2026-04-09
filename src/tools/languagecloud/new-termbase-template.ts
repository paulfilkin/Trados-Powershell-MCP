import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psPath } from "../../executors/common.js";

export function registerNewTermbaseTemplateTool(server: McpServer): void {
  server.tool(
    "lc_new_termbase_template",
    "Create a new termbase template. " +
    "The structure can be defined by language codes, inherited from an existing template, or from an XDT file.",
    {
      name:                    z.string().describe("Template name"),
      location_id:             z.string().optional().describe("Location ID"),
      location_name:           z.string().optional().describe("Location name"),
      language_codes:          z.string().optional().describe("Comma-separated language codes"),
      termbase_template_name:  z.string().optional().describe("Existing template name to inherit from"),
      xdt_path:                z.string().optional().describe("Path to XDT file (cannot combine with termbase_template_name)"),
      inherit_languages:       z.boolean().optional().describe("Inherit languages from template/XDT (default: true)"),
      description:             z.string().optional().describe("Description"),
    },
    async (params) => {
      try {
        const optionalArgs = [
          params.location_id            ? `-locationId ${psStr(params.location_id)}`                       : "",
          params.location_name          ? `-locationName ${psStr(params.location_name)}`                   : "",
          params.termbase_template_name ? `-termbaseTemplateName ${psStr(params.termbase_template_name)}`  : "",
          params.xdt_path               ? `-pathToXDT ${psPath(params.xdt_path)}`                          : "",
          params.inherit_languages !== undefined ? `-inheritLanguages $${params.inherit_languages}`         : "",
          params.description            ? `-description ${psStr(params.description)}`                      : "",
        ].filter(Boolean).join(" `\n            ");

        const langArg = params.language_codes
          ? `-languageCodes @(${params.language_codes.split(",").map(l => psStr(l.trim())).join(", ")})`
          : "";

        const script = `
          $result = New-TermbaseTemplate -accessKey $accessKey \`
            -name ${psStr(params.name)} \`
            ${langArg ? langArg + " `" : ""}
            ${optionalArgs}
          @{ termbaseTemplate = $result } | ConvertTo-Json -Depth 8 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
