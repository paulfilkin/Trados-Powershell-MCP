import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerRemoveTermbaseEntryTool(server: McpServer): void {
  server.tool(
    "lc_remove_termbase_entry",
    "Delete a single entry from a termbase.",
    {
      termbase_id: z.string().describe("Termbase ID"),
      entry_id:    z.string().describe("Entry ID"),
    },
    async (params) => {
      try {
        const script = `
          $result = Remove-TermbaseEntry -accessKey $accessKey -termbaseId ${psStr(params.termbase_id)} -entryId ${psStr(params.entry_id)}
          @{ removed = $true; entryId = ${psStr(params.entry_id)}; message = "$result" } | ConvertTo-Json -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
