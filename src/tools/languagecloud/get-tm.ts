import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ps7 } from "../../executors/ps7.js";
import { psStr } from "../../executors/common.js";

export function registerGetTmTool(server: McpServer): void {
  server.tool(
    "lc_get_tm",
    "Get details of a specific Language Cloud translation memory. Provide tm_name or tm_id.",
    {
      tm_name: z.string().optional().describe("TM name"),
      tm_id:   z.string().optional().describe("TM ID"),
    },
    async (params) => {
      try {
        const arg = params.tm_id
          ? `-translationMemoryId ${psStr(params.tm_id)}`
          : `-translationMemoryName ${psStr(params.tm_name ?? "")}`;

        const script = `
          $tm = Get-TranslationMemory -accessKey $accessKey ${arg}
          if ($null -eq $tm) {
            throw "TM not found"
          }
          @{ tm = $tm } | ConvertTo-Json -Depth 5 -Compress
        `;

        const result = await ps7("languagecloud", script);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
