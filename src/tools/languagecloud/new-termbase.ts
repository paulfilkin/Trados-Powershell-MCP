import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psPath } from "../../executors/common.js";

export function registerNewTermbaseTool(server: McpServer): void {
  server.tool(
    "lc_new_termbase",
    "Create a new termbase in Language Cloud. " +
    "Define structure via termbase_template (name or ID) or xdt_path (path to XDT file). " +
    "When using xdt_path, set inherit_languages to true to derive languages from the XDT definition.",
    {
      name:               z.string().describe("Termbase name"),
      termbase_template:  z.string().optional().describe("Termbase template name or ID. Required if xdt_path is not provided."),
      xdt_path:           z.string().optional().describe("Path to an XDT file defining the termbase structure. Alternative to termbase_template."),
      inherit_languages:  z.boolean().optional().describe("Inherit languages from the XDT file (default: true when xdt_path is provided)"),
      location_id:        z.string().optional().describe("Location ID to scope the termbase to (from lc_list_locations)"),
      description:        z.string().optional().describe("Optional description"),
    },
    async (params) => {
      try {
        if (!params.termbase_template && !params.xdt_path) {
          throw new Error("Provide either termbase_template or xdt_path");
        }

        const structureArg = params.xdt_path
          ? `-pathToXDT ${psPath(params.xdt_path)}`
          : `-termbaseTemplateName ${psStr(params.termbase_template!)}`;

        const optionalArgs = [
          params.inherit_languages !== undefined
            ? `-inheritLanguages $${params.inherit_languages}`
            : (params.xdt_path ? `-inheritLanguages $true` : ""),
          params.location_id  ? `-locationId ${psStr(params.location_id)}`              : "",
          params.description  ? `-termbaseDescription ${psStr(params.description)}`     : "",
        ].filter(Boolean).join(" `\n            ");

        const script = `
          $termbase = New-Termbase \`
            -accessKey    $accessKey \`
            -termbaseName ${psStr(params.name)} \`
            ${structureArg} \`
            ${optionalArgs}

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
