import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerUpdateTermbaseTool(server: McpServer): void {
  server.tool(
    "lc_update_termbase",
    "Update an existing termbase's name, description, copyright, or languages.",
    {
      termbase_id:   z.string().optional().describe("Termbase ID"),
      termbase_name: z.string().optional().describe("Termbase name (alternative to ID for lookup)"),
      name:          z.string().optional().describe("New name"),
      description:   z.string().optional().describe("New description"),
      copyright:     z.string().optional().describe("New copyright"),
      language_codes: z.string().optional().describe("Comma-separated language codes"),
    },
    async (params) => {
      try {
        const tbArg = params.termbase_id
          ? `-termbaseId ${psStr(params.termbase_id)}`
          : `-termbaseName ${psStr(params.termbase_name ?? "")}`;

        const optionalArgs = [
          params.name        ? `-name ${psStr(params.name)}`               : "",
          params.description ? `-description ${psStr(params.description)}` : "",
          params.copyright   ? `-copyRight ${psStr(params.copyright)}`     : "",
        ].filter(Boolean).join(" `\n            ");

        const langArg = params.language_codes
          ? `-languageCodes @(${params.language_codes.split(",").map(l => psStr(l.trim())).join(", ")})`
          : "";

        const script = `
          Update-Termbase -accessKey $accessKey \`
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
