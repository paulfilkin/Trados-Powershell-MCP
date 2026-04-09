import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerRemoveAllTermbaseEntriesTool(server: McpServer): void {
  server.tool(
    "lc_remove_all_termbase_entries",
    "Delete all entries from a termbase. " +
    "This is a destructive bulk operation and cannot be undone.",
    {
      termbase_id: z.string().describe("Termbase ID"),
    },
    async (params) => {
      try {
        const script = `
          $result = Remove-AllTermbaseEntries -accessKey $accessKey -termbaseId ${psStr(params.termbase_id)}
          @{ removed = $true; termbaseId = ${psStr(params.termbase_id)}; message = "$result" } | ConvertTo-Json -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
