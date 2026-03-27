import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerRemoveTmTool(server: McpServer): void {
  server.tool(
    "lc_remove_tm",
    "Delete a translation memory from Language Cloud. " +
    "The TM must not be in use by any active project.",
    {
      tm_id: z.string().describe("Translation memory ID (from lc_list_tms or lc_get_tm)"),
    },
    async (params) => {
      try {
        const script = `
          $result = Remove-TranslationMemory -accessKey $accessKey -translationMemoryId ${psStr(params.tm_id)}
          @{ removed = $true; tmId = ${psStr(params.tm_id)}; message = "$result" } | ConvertTo-Json -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
