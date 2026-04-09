import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr, psJsonParam } from "../../executors/common.js";

export function registerNewTermbaseEntryTool(server: McpServer): void {
  server.tool(
    "lc_new_termbase_entry",
    "Create a new terminology entry in a termbase. " +
    "The entry_json must contain a 'languages' array, each with 'language', 'terms', and optional 'termbaseFieldValues'.",
    {
      termbase_id: z.string().describe("Termbase ID (from lc_list_termbases)"),
      entry_json:  z.string().describe("JSON string representing the entry structure"),
    },
    async (params) => {
      try {
        const script = `
          $entry = ${psJsonParam(params.entry_json)}
          $result = New-TermbaseEntry -accessKey $accessKey -termbaseId ${psStr(params.termbase_id)} -entry $entry
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
