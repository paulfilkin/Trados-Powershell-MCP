import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerGetTermbaseEntryTool(server: McpServer): void {
  server.tool(
    "lc_get_termbase_entry",
    "Get full details of a single termbase entry including all languages, terms, and field values.",
    {
      termbase_id: z.string().describe("Termbase ID"),
      entry_id:    z.string().describe("Entry ID"),
    },
    async (params) => {
      try {
        const script = `
          $entry = Get-TermbaseEntry -accessKey $accessKey -termbaseId ${psStr(params.termbase_id)} -entryId ${psStr(params.entry_id)}
          @{ termbaseEntry = $entry } | ConvertTo-Json -Depth 10 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
