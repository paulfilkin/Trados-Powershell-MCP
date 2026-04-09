import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerListTermbaseEntriesTool(server: McpServer): void {
  server.tool(
    "lc_list_termbase_entries",
    "List entries in a termbase with optional pagination.",
    {
      termbase_id: z.string().describe("Termbase ID"),
      skip:        z.number().optional().describe("Items to skip for pagination (default: 0)"),
      top:         z.number().optional().describe("Items per page (default: 100)"),
    },
    async (params) => {
      try {
        const optionalArgs = [
          params.skip !== undefined ? `-skip ${params.skip}` : "",
          params.top !== undefined  ? `-top ${params.top}`   : "",
        ].filter(Boolean).join(" ");

        const script = `
          $entries = Get-AllTermbaseEntries -accessKey $accessKey -termbaseId ${psStr(params.termbase_id)} ${optionalArgs}
          @{ termbaseEntries = $entries } | ConvertTo-Json -Depth 10 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
