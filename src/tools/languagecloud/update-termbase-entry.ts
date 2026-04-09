import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psJsonParam } from "../../executors/common.js";

export function registerUpdateTermbaseEntryTool(server: McpServer): void {
  server.tool(
    "lc_update_termbase_entry",
    "Replace an existing termbase entry. " +
    "The entry body should include all languages and terms (with IDs for existing items). " +
    "Omitting an existing language or term removes it.",
    {
      termbase_id: z.string().describe("Termbase ID"),
      entry_id:    z.string().describe("Entry ID"),
      entry_json:  z.string().describe("JSON string representing the updated entry structure"),
    },
    async (params) => {
      try {
        const script = `
          $entry = ${psJsonParam(params.entry_json)}
          $result = Update-TermbaseEntry -accessKey $accessKey \`
            -termbaseId ${psStr(params.termbase_id)} \`
            -entryId ${psStr(params.entry_id)} \`
            -entry $entry
          @{ termbaseEntry = $result } | ConvertTo-Json -Depth 10 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
